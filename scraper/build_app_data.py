"""
スクレイパー出力のCSVをアプリ用に正規化して出力する。
- 表記揺れ統合
- artist補完 (songs.csvから)
- end_time自動補完 (次曲のstart_timeで代替)
- song_id / performance_id 採番
- data/performances.csv, data/songs.csv, data/videos.csv を出力
"""
from __future__ import annotations

import csv
import os
from typing import Optional

_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA_DIR = os.path.join(os.path.dirname(_DIR), "data")

INPUT_PERFORMANCES = os.path.join(_DATA_DIR, "song_performances.csv")
INPUT_SONGS = os.path.join(_DATA_DIR, "songs.csv")

OUTPUT_SONGS = os.path.join(_DATA_DIR, "app_songs.csv")
OUTPUT_PERFORMANCES = os.path.join(_DATA_DIR, "app_performances.csv")
OUTPUT_VIDEOS = os.path.join(_DATA_DIR, "app_videos.csv")

# --- 表記揺れ正規化マップ (lowercase -> 正規形) ---
NORMALIZE_MAP: dict[str, str] = {
    "strawberry": "Strawberry",
    "break through": "Break Through",
    "god knows…": "God knows…",
    "catch the moment": "Catch the Moment",
    "kisshug": "KissHug",
}


def normalize_song_name(name: str) -> str:
    return NORMALIZE_MAP.get(name.lower(), name)


def parse_time(t: str) -> int:
    """タイムスタンプを秒数に変換。"1:02:34"->3754, "13:28"->808, "24:46"->1486"""
    if not t:
        return 0
    parts = t.split(":")
    if len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    if len(parts) == 2:
        return int(parts[0]) * 60 + int(parts[1])
    return 0


def main() -> None:
    # 1. songs.csv からアーティスト情報を読み込み (補完用)
    artist_lookup: dict[str, str] = {}
    with open(INPUT_SONGS, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            name = normalize_song_name(row["song_name"])
            artist = row.get("artist", "")
            if artist and name not in artist_lookup:
                artist_lookup[name] = artist

    # 2. song_performances.csv を読み込み・正規化
    raw_rows: list[dict] = []
    with open(INPUT_PERFORMANCES, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            row["song_name"] = normalize_song_name(row["song_name"])
            row["start_seconds"] = parse_time(row["start_time"])
            row["end_seconds"] = parse_time(row["end_time"]) if row["end_time"] else 0
            # artist補完
            if not row["artist"] and row["song_name"] in artist_lookup:
                row["artist"] = artist_lookup[row["song_name"]]
            raw_rows.append(row)

    # 3. 曲マスタ生成 (song_name -> song_id)
    song_id_map: dict[str, str] = {}
    song_master: list[dict] = []
    for row in raw_rows:
        name = row["song_name"]
        if name not in song_id_map:
            sid = f"song_{len(song_id_map) + 1:04d}"
            song_id_map[name] = sid
            song_master.append({
                "song_id": sid,
                "title": name,
                "artist": row["artist"],
            })
        else:
            # アーティスト情報があれば更新
            if row["artist"]:
                for s in song_master:
                    if s["song_id"] == song_id_map[name] and not s["artist"]:
                        s["artist"] = row["artist"]

    # 4. 動画マスタ生成
    video_map: dict[str, str] = {}
    for row in raw_rows:
        vid = row["video_id"]
        if vid not in video_map:
            video_map[vid] = row.get("published_at", "")

    # 5. end_time自動補完
    # 同一動画内でstart_seconds順にソートし、次曲のstartをendとする
    from collections import defaultdict
    by_video: dict[str, list[dict]] = defaultdict(list)
    for row in raw_rows:
        by_video[row["video_id"]].append(row)

    for vid, rows in by_video.items():
        rows.sort(key=lambda r: r["start_seconds"])
        for i, row in enumerate(rows):
            if row["end_seconds"] == 0:
                if i + 1 < len(rows):
                    # 次曲のstart_timeをendとする
                    row["end_seconds"] = rows[i + 1]["start_seconds"]
                else:
                    # 最後の曲: start + 300秒 (5分)
                    row["end_seconds"] = row["start_seconds"] + 300

    # 6. パフォーマンスCSV生成
    performances: list[dict] = []
    perf_counter = 0
    for vid in by_video:
        for row in by_video[vid]:
            perf_counter += 1
            performances.append({
                "performance_id": f"perf_{perf_counter:04d}",
                "song_id": song_id_map[row["song_name"]],
                "video_id": row["video_id"],
                "start_seconds": row["start_seconds"],
                "end_seconds": row["end_seconds"],
                "published_at": row.get("published_at", ""),
            })

    # 7. CSV出力
    os.makedirs(_DATA_DIR, exist_ok=True)

    with open(OUTPUT_SONGS, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["song_id", "title", "artist"])
        w.writeheader()
        w.writerows(song_master)

    with open(OUTPUT_PERFORMANCES, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=[
            "performance_id", "song_id", "video_id",
            "start_seconds", "end_seconds", "published_at",
        ])
        w.writeheader()
        w.writerows(performances)

    with open(OUTPUT_VIDEOS, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["video_id", "published_at"])
        w.writeheader()
        for vid, pub in video_map.items():
            w.writerow({"video_id": vid, "published_at": pub})

    # サマリー
    print(f"Songs:        {len(song_master)} unique songs -> {OUTPUT_SONGS}")
    print(f"Performances: {len(performances)} entries -> {OUTPUT_PERFORMANCES}")
    print(f"Videos:       {len(video_map)} videos -> {OUTPUT_VIDEOS}")

    # end_time補完の統計
    filled_by_next = sum(1 for r in raw_rows if r.get("_end_filled"))
    original_empty = sum(1 for r in raw_rows if not r.get("end_time"))
    print(f"End time: {len(raw_rows) - original_empty} original, {original_empty} auto-filled")


if __name__ == "__main__":
    main()
