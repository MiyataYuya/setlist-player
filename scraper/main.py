from __future__ import annotations

import csv
import re
import os
from dataclasses import dataclass, field
from typing import Iterable, Optional

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA_DIR = os.path.join(os.path.dirname(_DIR), "data")

PLAYLIST_ID = "PLHFH8D2X0VLRqo9RT_kTi7FQl6Z_YyLGB"
API_KEY : str = os.environ.get("YOUTUBE_API_KEY")
if not API_KEY:
    raise RuntimeError("YOUTUBE_API_KEY is not set")

# -------- セトリ判定（ルールベース） --------
_TIME_RE = re.compile(r"\b(\d{1,2}:)?\d{1,2}:\d{2}\b")  # mm:ss or hh:mm:ss
_TIMESTAMP_PATTERN = r"(\d{1,2}:)?\d{1,2}:\d{2}"

def count_timestamp_lines(text: str) -> int:
    lines = text.splitlines()
    return sum(1 for line in lines if _TIME_RE.search(line))

def looks_like_setlist(text: str) -> bool:
    time_lines = count_timestamp_lines(text)
    has_keyword = ("セトリ" in text) or ("setlist" in text.lower())
    # 実務的な初期しきい値
    return (time_lines >= 5) or (has_keyword and time_lines >= 2)


# -------- 曲名パーサー --------
@dataclass
class SongEntry:
    song_name: str
    artist: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None


def parse_song_from_line(line: str, prev_time: Optional[str] = None) -> Optional[SongEntry]:
    """
    セトリの1行から曲名を抽出する。
    様々なフォーマットに対応:
    - "01. アカシア 00:13:28 - 00:17:45"
    - "00:13:28 - 00:17:45 アカシア"
    - "0:16:15 ♪ 悪魔の踊り方"
    - "12:53 #1 境界線 / amazarashi"
    - "00:20:40 八月、某、月明かり"
    - "00:11:39 ~ 00:15:13   Sleep Walking Orchestra"
    - "└ 逃避行 / Touhikou" (タイムスタンプが前行にある場合)
    """
    line = line.strip()
    if not line:
        return None

    # └ で始まる曲名行（タイムスタンプは前行）
    if line.startswith("└") or line.startswith("├"):
        cleaned = re.sub(r"^[└├]\s*", "", line)
        # アーティスト名を分離
        artist = None
        if " / " in cleaned:
            parts = cleaned.split(" / ", 1)
            cleaned = parts[0].strip()
            artist = parts[1].strip() if len(parts) > 1 else None
        if cleaned and len(cleaned) >= 2:
            return SongEntry(
                song_name=cleaned,
                artist=artist,
                start_time=prev_time,
                end_time=None,
            )
        return None

    # タイムスタンプがない行はスキップ
    if not _TIME_RE.search(line):
        return None

    start_time = None
    end_time = None
    artist = None

    # タイムスタンプを抽出
    time_matches = list(re.finditer(_TIMESTAMP_PATTERN, line))
    if time_matches:
        start_time = time_matches[0].group()
        if len(time_matches) >= 2:
            end_time = time_matches[1].group()

    # タイムスタンプを除去した部分から曲名を抽出
    cleaned = line
    for m in reversed(time_matches):  # 後ろから除去して位置ズレを防ぐ
        cleaned = cleaned[:m.start()] + cleaned[m.end():]

    # 番号記号を除去: "01.", "#1", "1.", "072.", "en.01", "01 ." など
    # 行頭の番号を除去
    cleaned = re.sub(r"^\s*\d{1,3}\s*[\.\)]\s*", "", cleaned)
    cleaned = re.sub(r"^\s*\d{1,3}\s+\.\s*", "", cleaned)  # "01 ." パターン
    cleaned = re.sub(r"^\s*#\s*\d+\s*", "", cleaned)
    cleaned = re.sub(r"^\s*en\s*\.?\s*\d+\s*[\.\)]?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^\s*en\s*\.\s*", "", cleaned, flags=re.IGNORECASE)  # "en." のみ
    # 区切り後の番号を除去 (例: "- 01. アカシア" → "アカシア")
    cleaned = re.sub(r"^\s*-\s*\d{1,3}\s*[\.\)]\s*", "", cleaned)

    # 装飾文字を除去: ♪, └, ├, 🎸 など
    cleaned = re.sub(r"[♪└├─🎸📜《》\[\]【】・]", "", cleaned)

    # 時間範囲の区切り文字を除去: "~", "-"
    cleaned = re.sub(r"\s*[~～]\s*", " ", cleaned)
    cleaned = re.sub(r"\s*-\s*$", "", cleaned)  # 末尾の " - " を除去
    cleaned = re.sub(r"^\s*-\s*", "", cleaned)  # 先頭の " - " を除去
    cleaned = re.sub(r"\s{2,}", " ", cleaned)   # 複数スペースを1つに
    cleaned = cleaned.strip()

    # アーティスト名を分離 (/ で区切られている場合)
    if " / " in cleaned:
        parts = cleaned.split(" / ", 1)
        cleaned = parts[0].strip()
        artist = parts[1].strip() if len(parts) > 1 else None

    # 括弧内の補足情報を除去（ただし曲名の一部の場合もあるので慎重に）
    # 長い括弧内の説明文を除去（10文字以上の括弧内は補足情報とみなす）
    cleaned = re.sub(r"\s*[\(（][^）\)]{10,}[）\)]\s*", "", cleaned)
    cleaned = re.sub(r"\s*[\(（](初披露|演奏前トーク|配信が止まる|少し巻き戻し|再開|アカペラあり|限界化)[）\)]\s*", "", cleaned)
    # 括弧内にタイムスタンプっぽいものがある場合も除去
    cleaned = re.sub(r"\s*[\(（][^）\)]*\d+:\d+[^）\)]*[）\)]\s*", "", cleaned)

    cleaned = cleaned.strip()

    # 空、または短すぎる場合はスキップ
    if not cleaned or len(cleaned) < 2:
        return None

    # 明らかにメタ情報の行をスキップ
    meta_keywords = [
        "開幕", "閉幕", "Start", "END", "トーク", "Talk", "休憩",
        "配信開始", "Stream Start", "エンディング", "Ending",
        "セットリスト", "Set List", "Setlist", "ライブ紹介",
        "スケジュール", "完走", "記念撮影のイントロ", "配信予定",
        "もう一曲歌うか", "企画した", "の話", "紹介",
        "BUMPには", "キャラバンが", "メメ様", "チケット",
        "ライブの", "歌詞", "当時の", "つらい時",
        "アカペラあり", "アカペラ", "限界化",
    ]
    for kw in meta_keywords:
        if kw in cleaned:
            return None

    # 曲名に含まれにくいパターンをスキップ
    if re.search(r"(について|してくれ|だった|ですよ|しよう|ください|思った|行った)", cleaned):
        return None

    return SongEntry(
        song_name=cleaned,
        artist=artist,
        start_time=start_time,
        end_time=end_time,
    )


def parse_setlist(text: str) -> list[SongEntry]:
    """セトリコメント全体をパースして曲リストを返す"""
    songs = []
    prev_time = None
    for line in text.splitlines():
        # 前行のタイムスタンプを保持（└ 行用）
        time_match = _TIME_RE.search(line)
        entry = parse_song_from_line(line, prev_time)
        if entry:
            songs.append(entry)
        if time_match:
            prev_time = time_match.group()
    return songs


# -------- データ構造 --------
@dataclass(frozen=True)
class Candidate:
    video_id: str
    author_name: str
    author_channel_id: str
    text: str
    timestamp_lines: int


# -------- YouTube API ヘルパ --------
def youtube_client(api_key: str):
    return build("youtube", "v3", developerKey=api_key)

def iter_playlist_video_ids(youtube, playlist_id: str) -> Iterable[str]:
    page_token: Optional[str] = None
    while True:
        req = youtube.playlistItems().list(
            part="contentDetails",
            playlistId=playlist_id,
            maxResults=50,        # 0..50
            pageToken=page_token,
        )
        resp = req.execute()
        for item in resp.get("items", []):
            vid = item.get("contentDetails", {}).get("videoId")
            if vid:
                yield vid

        page_token = resp.get("nextPageToken")
        if not page_token:
            break

def iter_comment_candidates(youtube, video_id: str, max_pages: int = 5) -> list[Candidate]:
    """
    order=time で最新側から最大 max_pages*100 件を走査して候補を拾う。
    セトリ職人が上の方に書いてくれている運用ならこれで十分当たることが多い。
    """
    candidates: list[Candidate] = []
    page_token: Optional[str] = None

    for _ in range(max_pages):
        req = youtube.commentThreads().list(
            part="snippet",
            videoId=video_id,
            maxResults=100,  # 1..100
            order="time",
            textFormat="plainText",
            pageToken=page_token,
        )
        resp = req.execute()

        for th in resp.get("items", []):
            snip = th.get("snippet", {}).get("topLevelComment", {}).get("snippet", {})
            text = snip.get("textDisplay") or ""
            if not text:
                continue

            if looks_like_setlist(text):
                author_name = snip.get("authorDisplayName") or ""
                author_channel_id = (snip.get("authorChannelId") or {}).get("value") or ""
                candidates.append(
                    Candidate(
                        video_id=video_id,
                        author_name=author_name,
                        author_channel_id=author_channel_id,
                        text=text,
                        timestamp_lines=count_timestamp_lines(text),
                    )
                )

        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    # 「よりセトリっぽい」順に並べる
    candidates.sort(key=lambda c: c.timestamp_lines, reverse=True)
    return candidates


# -------- データ構造（パフォーマンス） --------
@dataclass
class Performance:
    video_id: str
    song_name: str
    artist: Optional[str]
    start_time: Optional[str]
    end_time: Optional[str]


# -------- メイン処理 --------
def main() -> None:
    youtube = youtube_client(API_KEY)

    out_rows = []
    all_performances: list[Performance] = []

    try:
        for i, vid in enumerate(iter_playlist_video_ids(youtube, PLAYLIST_ID), start=1):
            cands = iter_comment_candidates(youtube, vid, max_pages=5)
            if not cands:
                print(f"[{i}] {vid}: no setlist-like comment found")
                continue

            best = cands[0]
            songs = parse_setlist(best.text)
            print(f"[{i}] {vid}: best by {best.author_name} (songs={len(songs)})")

            # 候補コメントを保存
            out_rows.append({
                "video_id": best.video_id,
                "video_url": f"https://www.youtube.com/watch?v={best.video_id}",
                "author_name": best.author_name,
                "author_channel_id": best.author_channel_id,
                "timestamp_lines": best.timestamp_lines,
                "setlist_comment_text": best.text,
            })

            # パフォーマンスを記録
            for song in songs:
                all_performances.append(Performance(
                    video_id=vid,
                    song_name=song.song_name,
                    artist=song.artist,
                    start_time=song.start_time,
                    end_time=song.end_time,
                ))

    except HttpError as e:
        print("YouTube API error:", e)
        raise

    # CSV出力: setlist_candidates.csv
    out_path = os.path.join(_DIR, "setlist_candidates.csv")
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=[
            "video_id", "video_url",
            "author_name", "author_channel_id",
            "timestamp_lines", "setlist_comment_text",
        ])
        w.writeheader()
        w.writerows(out_rows)
    print(f"written: {out_path} ({len(out_rows)} rows)")

    # CSV出力: song_performances.csv（曲×配信のマッピング）
    perf_path = os.path.join(_DATA_DIR, "song_performances.csv")
    with open(perf_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=[
            "song_name", "artist", "video_id", "video_url", "start_time", "end_time",
        ])
        w.writeheader()
        for p in all_performances:
            w.writerow({
                "song_name": p.song_name,
                "artist": p.artist or "",
                "video_id": p.video_id,
                "video_url": f"https://www.youtube.com/watch?v={p.video_id}",
                "start_time": p.start_time or "",
                "end_time": p.end_time or "",
            })
    print(f"written: {perf_path} ({len(all_performances)} rows)")

    # CSV出力: songs.csv（ユニークな曲リスト）
    song_counts: dict[str, dict] = {}
    for p in all_performances:
        key = p.song_name
        if key not in song_counts:
            song_counts[key] = {"song_name": p.song_name, "artist": p.artist, "play_count": 0}
        song_counts[key]["play_count"] += 1
        # アーティスト情報があれば更新
        if p.artist and not song_counts[key]["artist"]:
            song_counts[key]["artist"] = p.artist

    songs_path = os.path.join(_DATA_DIR, "songs.csv")
    with open(songs_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["song_name", "artist", "play_count"])
        w.writeheader()
        for song in sorted(song_counts.values(), key=lambda x: x["play_count"], reverse=True):
            w.writerow(song)
    print(f"written: {songs_path} ({len(song_counts)} unique songs)")


if __name__ == "__main__":
    main()
