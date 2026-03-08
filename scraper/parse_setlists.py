"""
setlists_raw.json から曲名をパースしてCSVを出力する。
APIを呼ばずに何度でも実行可能。
"""
from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass
from typing import Optional

import os

_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA_DIR = os.path.join(os.path.dirname(_DIR), "data")

INPUT_FILE = os.path.join(_DIR, "setlists_raw.json")
OUTPUT_SONGS = os.path.join(_DATA_DIR, "songs.csv")
OUTPUT_PERFORMANCES = os.path.join(_DATA_DIR, "song_performances.csv")

# -------- タイムスタンプ正規表現 --------
_TIME_RE = re.compile(r"\b(\d{1,2}:)?\d{1,2}:\d{2}\b")
_TIMESTAMP_PATTERN = r"(\d{1,2}:)?\d{1,2}:\d{2}"


def time_to_seconds(time_str: str) -> int:
    """タイムスタンプを秒数に変換 (例: "1:02:34" -> 3754, "13:28" -> 808)"""
    parts = time_str.split(":")
    if len(parts) == 2:
        return int(parts[0]) * 60 + int(parts[1])
    elif len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    return 0


def make_video_url(video_id: str, start_time: Optional[str] = None) -> str:
    """動画URLを生成（タイムスタンプ付き）"""
    base_url = f"https://youtu.be/{video_id}"
    if start_time:
        seconds = time_to_seconds(start_time)
        return f"{base_url}?t={seconds}"
    return base_url


# -------- データ構造 --------
@dataclass
class SongEntry:
    song_name: str
    artist: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None


@dataclass
class Performance:
    video_id: str
    published_at: Optional[str]
    song_name: str
    artist: Optional[str]
    start_time: Optional[str]
    end_time: Optional[str]


# -------- 曲名パーサー --------
def parse_song_from_line(line: str, prev_time: Optional[str] = None) -> Optional[SongEntry]:
    """
    セトリの1行から曲名を抽出する。
    """
    line = line.strip()
    if not line:
        return None

    # └ や ├ で始まる曲名行（タイムスタンプは前行）
    if line.startswith("└") or line.startswith("├"):
        cleaned = re.sub(r"^[└├]\s*", "", line)
        artist = None
        if " / " in cleaned:
            parts = cleaned.split(" / ", 1)
            cleaned = parts[0].strip()
            artist = parts[1].strip() if len(parts) > 1 else None
        # 括弧内の補足を除去
        cleaned = re.sub(r"\s*[\(（][^）\)]*[）\)]\s*", "", cleaned)
        cleaned = cleaned.strip()
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

    # タイムスタンプを除去
    cleaned = line
    for m in reversed(time_matches):
        cleaned = cleaned[:m.start()] + cleaned[m.end():]

    # 番号記号を除去
    cleaned = re.sub(r"^\s*\d{1,3}\s*[\.\)]\s*", "", cleaned)
    cleaned = re.sub(r"^\s*\d{1,3}\s+\.\s*", "", cleaned)
    cleaned = re.sub(r"^\s*#\s*\d+\s*", "", cleaned)
    cleaned = re.sub(r"^\s*en\s*\.?\s*\d+\s*[\.\)]?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^\s*en\s*\.\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^\s*-\s*\d{1,3}\s*[\.\)]\s*", "", cleaned)

    # 装飾文字を除去
    cleaned = re.sub(r"[♪└├─🎸📜《》\[\]【】・🎩]", "", cleaned)

    # 時間範囲の区切り文字を除去
    cleaned = re.sub(r"\s*[~～]\s*", " ", cleaned)
    cleaned = re.sub(r"\s*-\s*$", "", cleaned)
    cleaned = re.sub(r"^\s*-\s*", "", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    cleaned = cleaned.strip()

    # アーティスト名を分離
    if " / " in cleaned:
        parts = cleaned.split(" / ", 1)
        cleaned = parts[0].strip()
        artist = parts[1].strip() if len(parts) > 1 else None

    # 括弧内の補足情報を除去
    cleaned = re.sub(r"\s*[\(（][^）\)]{10,}[）\)]\s*", "", cleaned)
    cleaned = re.sub(r"\s*[\(（](初披露|演奏前トーク|配信が止まる|少し巻き戻し|再開|アカペラあり|限界化)[）\)]\s*", "", cleaned)
    cleaned = re.sub(r"\s*[\(（][^）\)]*\d+:\d+[^）\)]*[）\)]\s*", "", cleaned)
    cleaned = cleaned.strip()

    # 短すぎる場合はスキップ
    if not cleaned or len(cleaned) < 2:
        return None

    # メタ情報をスキップ
    meta_keywords = [
        "開幕", "閉幕", "Start", "END", "トーク", "Talk", "休憩",
        "配信開始", "Stream Start", "エンディング", "Ending",
        "セットリスト", "Set List", "Setlist", "ライブ紹介",
        "スケジュール", "完走", "記念撮影のイントロ", "配信予定",
        "もう一曲歌うか", "企画した", "の話", "紹介",
        "BUMPには", "キャラバンが", "メメ様", "チケット",
        "ライブの", "歌詞", "当時の", "つらい時",
        "アカペラあり", "アカペラ", "限界化",
        "自己紹介", "コラボ", "グッズ", "アワステ",
        "配信回数", "歌枠",
    ]
    for kw in meta_keywords:
        if kw in cleaned:
            return None

    # 動詞的パターンをスキップ
    if re.search(r"(について|してくれ|だった|ですよ|しよう|ください|思った|行った|当たらなかった|良さがわからなかった)", cleaned):
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
        time_match = _TIME_RE.search(line)
        entry = parse_song_from_line(line, prev_time)
        if entry:
            songs.append(entry)
        if time_match:
            prev_time = time_match.group()
    return songs


def main() -> None:
    # JSON読み込み
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Loaded {len(data)} videos from {INPUT_FILE}")

    all_performances: list[Performance] = []
    videos_with_songs = 0
    videos_without_songs = 0

    for video_id, video_data in data.items():
        best_comment = video_data.get("best_comment")
        published_at = video_data.get("published_at")
        if not best_comment:
            videos_without_songs += 1
            continue

        songs = parse_setlist(best_comment)
        if songs:
            videos_with_songs += 1
            print(f"  {video_id}: {len(songs)} songs")
        else:
            videos_without_songs += 1
            print(f"  {video_id}: 0 songs (parsing failed)")

        for song in songs:
            all_performances.append(Performance(
                video_id=video_id,
                published_at=published_at,
                song_name=song.song_name,
                artist=song.artist,
                start_time=song.start_time,
                end_time=song.end_time,
            ))

    # CSV出力: song_performances.csv
    with open(OUTPUT_PERFORMANCES, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=[
            "song_name", "artist", "video_id", "video_url", "published_at", "start_time", "end_time",
        ])
        w.writeheader()
        for p in all_performances:
            w.writerow({
                "song_name": p.song_name,
                "artist": p.artist or "",
                "video_id": p.video_id,
                "video_url": make_video_url(p.video_id, p.start_time),
                "published_at": p.published_at or "",
                "start_time": p.start_time or "",
                "end_time": p.end_time or "",
            })
    print(f"\nWritten: {OUTPUT_PERFORMANCES} ({len(all_performances)} rows)")

    # CSV出力: songs.csv（ユニークな曲リスト）
    song_counts: dict[str, dict] = {}
    for p in all_performances:
        key = p.song_name
        if key not in song_counts:
            song_counts[key] = {"song_name": p.song_name, "artist": p.artist, "play_count": 0}
        song_counts[key]["play_count"] += 1
        if p.artist and not song_counts[key]["artist"]:
            song_counts[key]["artist"] = p.artist

    with open(OUTPUT_SONGS, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["song_name", "artist", "play_count"])
        w.writeheader()
        for song in sorted(song_counts.values(), key=lambda x: x["play_count"], reverse=True):
            w.writerow(song)
    print(f"Written: {OUTPUT_SONGS} ({len(song_counts)} unique songs)")

    # サマリー
    print(f"\n=== Summary ===")
    print(f"Videos with songs: {videos_with_songs}")
    print(f"Videos without songs: {videos_without_songs}")
    print(f"Total performances: {len(all_performances)}")
    print(f"Unique songs: {len(song_counts)}")


if __name__ == "__main__":
    main()
