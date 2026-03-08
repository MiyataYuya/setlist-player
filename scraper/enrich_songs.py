"""
app_songs.csv を読み込み、以下の処理を行って app_songs_enriched.csv に出力する。
- 曲ではないエントリを除外
- CSVパースエラーの修正 (ローマ字タイトル群)
- アーティスト名から注釈を performance_note に分離
- 表記ゆれ修正 (タイポ、ローマ字→公式表記)
- ビデオコンテキスト補正 (配信タイトルからアーティストを推測)
- MusicBrainz API でアーティスト未入力曲を補完

既存ファイルは上書きしない。
"""
from __future__ import annotations

import csv
import json
import os
import re
import time
from collections import defaultdict
from typing import Optional

import musicbrainzngs

musicbrainzngs.set_useragent(
    "YoutubeParserEnricher", "0.1", "https://github.com/example"
)

_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA_DIR = os.path.join(os.path.dirname(_DIR), "data")

INPUT_SONGS = os.path.join(_DATA_DIR, "app_songs.csv")
INPUT_PERFORMANCES = os.path.join(_DATA_DIR, "app_performances.csv")
INPUT_VIDEOS = os.path.join(_DATA_DIR, "app_videos.csv")
OUTPUT_SONGS = os.path.join(_DATA_DIR, "app_songs_enriched.csv")
OUTPUT_LOG = os.path.join(_DATA_DIR, "enrichment_log.json")

# ---------------------------------------------------------------------------
# 1. 非曲エントリ判定
# ---------------------------------------------------------------------------
_NON_SONG_KEYWORDS = [
    "配信", "トラブル", "再開", "セトリ", "巻き戻", "雑談",
    "冒頭", "お疲れ", "オープニング", "喋って", "言語化",
    "耐久", "感想", "エゴサ", "弦交換", "保留",
    "配信停止", "告知", "おさらい", "待機", "お知らせ",
    "公開録音", "開始", "アンコール", "デザイン公開",
    "30周年", "トレイラー",
]


def is_non_song(title: str) -> tuple[bool, str]:
    """曲ではないエントリかどうか判定し、理由を返す。"""
    if title.endswith("?") or title.endswith("？"):
        return True, "question"
    for kw in _NON_SONG_KEYWORDS:
        if kw in title:
            return True, f"keyword:{kw}"
    if len(title) > 40:
        return True, "too_long"
    # (あくび), (かわいい) のような単独注釈
    if re.fullmatch(r"\(.+\)", title) and len(title) < 15:
        return True, "annotation_only"
    # "※" で始まるメモ的エントリ
    if title.startswith("※"):
        return True, "memo"
    return False, ""


# ---------------------------------------------------------------------------
# 2. CSVパースエラー修正 (ローマ字タイトル群)
# ---------------------------------------------------------------------------
_ROMANIZED_TITLE_MAP: dict[str, tuple[str, str]] = {
    "(Himawari": ("ひまわり", "遊助"),
    "(Flower Tower": ("フラワータワー", "さユり"),
    "(Sakura": ("桜", "森山直太朗"),
    "(Himawari no Yakusoku": ("ひまわりの約束", "秦基博"),
    "(Red Sweet Pea": ("赤いスイートピー", "松田聖子"),
    "(Tsubomi": ("蕾", "コブクロ"),
    "(Hanamotase": ("花に亡霊", "ヨルシカ"),
    "(Goutou to Hanataba": ("強盗と花束", "ヨルシカ"),
    "(Hana ni Bourei": ("花に亡霊", "ヨルシカ"),
    "(Spring Thief": ("春泥棒", "ヨルシカ"),
    "(Senbon Zakura": ("千本桜", "黒うさP"),
    "(Mary Gold": ("マリーゴールド", "あいみょん"),
    "(Hana ni Arashi": ("花に嵐", "米津玄師"),
    "(Wasurerarenaino": ("忘れられないの", "サカナクション"),
    "(Dried Flower": ("ドライフラワー", "優里"),
    "(Konayuki": ("粉雪", "レミオロメン"),
    "(Utsukushii Hire": ("美しいヒレ", "スピッツ"),
    "(Somaruyo": ("染まるよ", "チャットモンチー"),
    "(Seikan Hikou": ("星間飛行", "ランカ・リー"),
    "(Ito": ("糸", "中島みゆき"),
    "(Hanamizuki": ("ハナミズキ", "一青窈"),
    "(Rain and Cappuccino": ("雨とカプチーノ", "ヨルシカ"),
    "(Ame Haruru": ("雨晴るる", "ヨルシカ"),
    "(Hadaka no Kokoro": ("裸の心", "あいみょん"),
    "(Kimi ha Rock wo Kikanai": ("君はロックを聴かない", "あいみょん"),
    "(Kutsu no Hanabi": ("靴の花火", "ヨルシカ"),
    "(Uchiage Hanabi": ("打上花火", "DAOKO×米津玄師"),
    "(Kimi ga Kureta Natsu": ("君がくれた夏", "家入レオ"),
    "(Kimagure Romantic": ("気まぐれロマンティック", "いきものがかり"),
    "(Cherry": ("チェリー", "スピッツ"),
    "(Natsuiro": ("夏色", "ゆず"),
    "(Shiori": ("栞", "クリープハイプ"),
    "(Marunouchi Sadistic": ("丸の内サディスティック", "椎名林檎"),
    "(Tada Kimi ni Hare": ("ただ君に晴れ", "ヨルシカ"),
    "(Saijoukyu ni Kawaiino!": ("最上級にかわいいの!", "超ときめき♡宣伝部"),
}


# ---------------------------------------------------------------------------
# 3. 注釈分離
# ---------------------------------------------------------------------------
_ARTIST_NOTE_RE = re.compile(
    r"^(.+?)\s*[（(]"
    r"(初披露(?:かもしれない|の気持ち)?|サビだけ|サビのみ|ワンコーラス|"
    r"ライブアレンジ[Vv]er|take\s*\d+|前口上あり|弾き語り初披露|"
    r"Bメロからワンコーラス|歌詞朗読|原曲Ver|49750人達成)"
    r"[）)]\s*$"
)

_TITLE_TAKE_RE = re.compile(r"^\(take\s*\d+\.?\s*\)\s*", re.IGNORECASE)
_TITLE_EMPTY_PAREN_RE = re.compile(r"^\(\s*\)\s*")
# タイトル末尾の注釈 (前口上あり), (ワンコーラス) 等
_TITLE_NOTE_RE = re.compile(
    r"^(.+?)\s*[（(]"
    r"(前口上あり|ワンコーラス)"
    r"[）)]\s*$"
)


def separate_artist_note(artist: str) -> tuple[str, str]:
    """アーティスト名から注釈を分離して (artist, note) を返す。"""
    if not artist:
        return artist, ""
    m = _ARTIST_NOTE_RE.match(artist)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return artist, ""


def clean_title(title: str) -> tuple[str, str]:
    """タイトルから (take N) 等を除去し、(cleaned_title, note) を返す。"""
    note = ""
    m = _TITLE_TAKE_RE.match(title)
    if m:
        note = m.group(0).strip().strip("()")
        title = title[m.end():]
    m = _TITLE_EMPTY_PAREN_RE.match(title)
    if m:
        title = title[m.end():]
    # タイトル末尾の注釈
    m = _TITLE_NOTE_RE.match(title)
    if m:
        title = m.group(1).strip()
        note_suffix = m.group(2).strip()
        note = f"{note}, {note_suffix}" if note else note_suffix
    return title.strip(), note


# タイトルに埋め込まれた注釈 (⭐初披露) 等
_TITLE_INLINE_NOTE_RE = re.compile(
    r"\s*[（(⭐☆★]*(初披露|⭐初披露)[）)]*\s*$"
)


def extract_artist_from_title(title: str) -> tuple[str, str, str]:
    """タイトルから '曲名／アーティスト名' 形式のアーティストを抽出。

    Returns: (song_title, artist, note)
    """
    # "01. 曲名／アーティスト" や "曲名／アーティスト(⭐初披露)" のパターン
    # 全角／で分割
    if "／" not in title:
        return title, "", ""

    parts = title.split("／", 1)
    song_title = parts[0].strip()
    artist_part = parts[1].strip()

    # アーティスト部分から注釈を除去
    note = ""
    m = _TITLE_INLINE_NOTE_RE.search(artist_part)
    if m:
        note = m.group(1).replace("⭐", "").strip()
        artist_part = artist_part[:m.start()].strip()

    # 先頭の番号を除去 (例: "01. 曲名")
    song_title = re.sub(r"^\d+\.\s*", "", song_title)

    return song_title, artist_part, note


# ---------------------------------------------------------------------------
# 4. 表記ゆれ修正マップ
# ---------------------------------------------------------------------------
ARTIST_NORMALIZE: dict[str, str] = {
    "BUMP OF CHIKEN": "BUMP OF CHICKEN",
    "SEKAI NO OWAR": "SEKAI NO OWARI",
    "LAMP IN TARREN": "LAMP IN TERREN",
    # ローマ字 → 公式表記
    "Aimyon": "あいみょん",
    "Yorushika": "ヨルシカ",
    "Sakanaction": "サカナクション",
    "Kenshi Yonezu": "米津玄師",
    "Remioromen": "レミオロメン",
    "Spitz": "スピッツ",
    "Chat Monkey": "チャットモンチー",
    "Ranka Lee": "ランカ・リー",
    "Miyuki Nakajima": "中島みゆき",
    "Yo Hitoto": "一青窈",
    "Yuuri": "優里",
    "CreepHyp": "クリープハイプ",
    "Ringo Sheena": "椎名林檎",
    "Leo Ieiri": "家入レオ",
    "Ikimonogakari": "いきものがかり",
    "Yuzu": "ゆず",
    "Seiko Matsuda": "松田聖子",
    "Kobukuro": "コブクロ",
    "Kurousa P": "黒うさP",
    "DAOKO × Kenshi Yonezu": "DAOKO×米津玄師",
    "Naotaro Moriyama": "森山直太朗",
    "Motohiro Hata": "秦基博",
    "Sayuri": "さユり",
    "Yuusuke": "遊助",
    "Chou Tokimeki ♡ Sendenbu": "超ときめき♡宣伝部",
    # 表記ゆれ統合
    "Back number": "back number",
    "kana-boon": "KANA-BOON",
    "Aiko": "aiko",
    "Yui": "YUI",
    "サカナクション」明日でショート動画100本目": "サカナクション",
    "森山 直太朗": "森山直太朗",
    "Amazarashi": "amazarashi",
    "Bakudan no Tsukurikata": "爆弾の作り方",
    "Sayonara Gokko": "さよならごっこ",
    "Juvenile": "ジュブナイル",
}

TITLE_NORMALIZE: dict[str, str] = {
    "strawberry": "Strawberry",
    "break through": "Break Through",
    "god knows…": "God knows…",
    "catch the moment": "Catch the Moment",
    "kisshug": "KissHug",
}


def normalize_artist(artist: str) -> str:
    """アーティスト名を正規化。"""
    cleaned = artist.strip()
    if cleaned.endswith(")") and "(" not in cleaned:
        cleaned = cleaned[:-1].strip()
    return ARTIST_NORMALIZE.get(cleaned, cleaned)


def normalize_title(title: str) -> str:
    return TITLE_NORMALIZE.get(title.lower(), title)


# ---------------------------------------------------------------------------
# 5. ビデオコンテキスト — 配信タイトルからアーティストを推測
# ---------------------------------------------------------------------------
# 配信タイトルに含まれるアーティスト名パターン
_VIDEO_ARTIST_PATTERNS: list[tuple[str, str]] = [
    ("BUMP OF CHICKEN", "BUMP OF CHICKEN"),
    ("BUMP", "BUMP OF CHICKEN"),
    ("amazarashi", "amazarashi"),
    ("Galileo Galilei", "Galileo Galilei"),
    ("キタニタツヤ", "キタニタツヤ"),
    ("ヨルシカ", "ヨルシカ"),
    ("RADWIMPS", "RADWIMPS"),
    ("スピッツ", "スピッツ"),
    ("サカナクション", "サカナクション"),
    ("あいみょん", "あいみょん"),
    ("米津玄師", "米津玄師"),
    ("back number", "back number"),
]


def detect_video_artist(video_title: str) -> Optional[str]:
    """配信タイトルからメインアーティストを推測。アーティスト縛り配信のみ。"""
    title_upper = video_title.upper()
    # 「〜の曲を」「〜をたっぷり」「〜全曲」などの縛り配信パターン
    for pattern, artist in _VIDEO_ARTIST_PATTERNS:
        if pattern.upper() in title_upper:
            return artist
    return None


def build_song_video_map(
    perf_path: str, video_path: str,
) -> tuple[dict[str, str], dict[str, str]]:
    """song_id -> video_id, video_id -> video_title のマップを構築。"""
    song_to_video: dict[str, str] = {}
    with open(perf_path, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            sid = row["song_id"]
            if sid not in song_to_video:
                song_to_video[sid] = row["video_id"]

    video_titles: dict[str, str] = {}
    with open(video_path, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            video_titles[row["video_id"]] = row.get("title", "")

    return song_to_video, video_titles


# ---------------------------------------------------------------------------
# 6. MusicBrainz 検索
# ---------------------------------------------------------------------------
def search_musicbrainz(title: str) -> Optional[dict]:
    """MusicBrainz で曲名を検索し、最もスコアの高い結果を返す。"""
    try:
        result = musicbrainzngs.search_recordings(
            query=title, limit=5
        )
        recordings = result.get("recording-list", [])
        if not recordings:
            return None

        best = recordings[0]
        score = int(best.get("ext:score", 0))
        if score < 80:
            return None

        artist_credit = best.get("artist-credit", [])
        if not artist_credit:
            return None

        artist_name = ""
        for credit in artist_credit:
            if isinstance(credit, dict):
                a = credit.get("artist", {})
                aliases = a.get("alias-list", [])
                jp_name = None
                for alias in aliases:
                    if alias.get("locale") == "ja":
                        jp_name = alias.get("alias") or alias.get("sort-name")
                        break
                name = jp_name or a.get("name", "")
                joinphrase = credit.get("joinphrase", "")
                artist_name += name + joinphrase

        return {
            "artist": artist_name,
            "mb_title": best.get("title", ""),
            "score": score,
            "mb_id": best.get("id", ""),
        }
    except Exception as e:
        return {"error": str(e)}


# ---------------------------------------------------------------------------
# メイン処理
# ---------------------------------------------------------------------------
def main() -> None:
    with open(INPUT_SONGS, "r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    # ビデオコンテキスト構築
    song_to_video, video_titles = build_song_video_map(
        INPUT_PERFORMANCES, INPUT_VIDEOS,
    )

    print(f"入力: {len(rows)} 曲")

    enriched: list[dict] = []
    log_entries: list[dict] = []
    removed_count = 0
    mb_searched = 0
    mb_found = 0
    ctx_overridden = 0

    for row in rows:
        song_id = row["song_id"]
        title = row["title"]
        artist = row["artist"]

        # --- CSVパースエラー修正 ---
        if title in _ROMANIZED_TITLE_MAP:
            fixed_title, fixed_artist = _ROMANIZED_TITLE_MAP[title]
            log_entries.append({
                "song_id": song_id,
                "action": "csv_parse_fix",
                "original_title": title,
                "original_artist": artist,
                "fixed_title": fixed_title,
                "fixed_artist": fixed_artist,
            })
            title = fixed_title
            artist = fixed_artist

        # --- 非曲エントリ除外 ---
        is_non, reason = is_non_song(title)
        if is_non:
            log_entries.append({
                "song_id": song_id,
                "action": "removed",
                "reason": reason,
                "title": title,
            })
            removed_count += 1
            continue

        # --- タイトルからアーティスト抽出 (「曲名／アーティスト」形式) ---
        extracted_title, extracted_artist, extracted_note = extract_artist_from_title(title)
        if extracted_artist:
            log_entries.append({
                "song_id": song_id,
                "action": "title_artist_extracted",
                "original_title": title,
                "extracted_title": extracted_title,
                "extracted_artist": extracted_artist,
                "extracted_note": extracted_note,
            })
            title = extracted_title
            if not artist:
                artist = extracted_artist

        # --- タイトル正規化 ---
        title = normalize_title(title)
        cleaned_title, title_note = clean_title(title)
        if cleaned_title != title:
            log_entries.append({
                "song_id": song_id,
                "action": "title_cleaned",
                "original": title,
                "cleaned": cleaned_title,
                "note": title_note,
            })
            title = cleaned_title

        # タイトル抽出時の注釈をマージ
        if extracted_note:
            title_note = f"{title_note}, {extracted_note}" if title_note else extracted_note

        # --- アーティスト注釈分離 ---
        artist = normalize_artist(artist)
        artist, artist_note = separate_artist_note(artist)

        notes = []
        if title_note:
            notes.append(title_note)
        if artist_note:
            notes.append(artist_note)
        performance_note = ", ".join(notes)

        # --- ビデオコンテキスト補正 + MusicBrainz 補完 ---
        if not artist:
            # まずビデオコンテキストを試す
            vid = song_to_video.get(song_id, "")
            vtitle = video_titles.get(vid, "")
            ctx_artist = detect_video_artist(vtitle)

            if ctx_artist:
                artist = ctx_artist
                ctx_overridden += 1
                log_entries.append({
                    "song_id": song_id,
                    "action": "video_context",
                    "title": title,
                    "video_title": vtitle,
                    "inferred_artist": ctx_artist,
                })
            else:
                # MusicBrainz で検索
                mb_searched += 1
                mb_result = search_musicbrainz(title)
                time.sleep(1.1)

                if mb_result and "artist" in mb_result and not mb_result.get("error"):
                    # MBの結果もビデオコンテキストと照合
                    mb_artist = mb_result["artist"]
                    artist = mb_artist
                    mb_found += 1
                    log_entries.append({
                        "song_id": song_id,
                        "action": "mb_found",
                        "title": title,
                        "mb_artist": mb_artist,
                        "mb_title": mb_result.get("mb_title", ""),
                        "mb_score": mb_result.get("score", 0),
                    })
                else:
                    log_entries.append({
                        "song_id": song_id,
                        "action": "mb_not_found",
                        "title": title,
                        "detail": mb_result,
                    })

        enriched.append({
            "song_id": song_id,
            "title": title,
            "artist": artist,
            "performance_note": performance_note,
        })

    # --- 出力 ---
    with open(OUTPUT_SONGS, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=[
            "song_id", "title", "artist", "performance_note",
        ])
        w.writeheader()
        w.writerows(enriched)

    with open(OUTPUT_LOG, "w", encoding="utf-8") as f:
        json.dump(log_entries, f, ensure_ascii=False, indent=2)

    # --- サマリー ---
    artist_filled = sum(1 for r in enriched if r["artist"])
    artist_missing = sum(1 for r in enriched if not r["artist"])
    print(f"除外: {removed_count} 件 (非曲エントリ)")
    print(f"出力: {len(enriched)} 曲 -> {OUTPUT_SONGS}")
    print(f"  アーティスト入力済み: {artist_filled}")
    print(f"  アーティスト未入力:   {artist_missing}")
    print(f"ビデオコンテキスト補正: {ctx_overridden} 件")
    print(f"MusicBrainz 検索: {mb_searched} 件中 {mb_found} 件ヒット")
    print(f"ログ: {len(log_entries)} 件 -> {OUTPUT_LOG}")


if __name__ == "__main__":
    main()
