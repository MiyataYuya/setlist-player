"""
YouTube APIからセトリコメントを取得してJSONで保存する。
API呼び出しを最小限にするため、このスクリプトは1回だけ実行すればよい。
"""
from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, asdict
from typing import Iterable, Optional

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


_DIR = os.path.dirname(os.path.abspath(__file__))
PLAYLISTS_FILE = os.path.join(_DIR, "playlists.txt")
API_KEY: str = os.environ.get("YOUTUBE_API_KEY")
if not API_KEY:
    raise RuntimeError("YOUTUBE_API_KEY is not set")

OUTPUT_FILE = os.path.join(_DIR, "setlists_raw.json")


def load_playlist_ids(filepath: str) -> list[str]:
    """playlists.txtからプレイリストIDを読み込む"""
    ids = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                ids.append(line)
    return ids

# -------- セトリ判定（ルールベース） --------
_TIME_RE = re.compile(r"\b(\d{1,2}:)?\d{1,2}:\d{2}\b")


def count_timestamp_lines(text: str) -> int:
    return sum(1 for line in text.splitlines() if _TIME_RE.search(line))


def looks_like_setlist(text: str) -> bool:
    time_lines = count_timestamp_lines(text)
    has_keyword = ("セトリ" in text) or ("setlist" in text.lower())
    return (time_lines >= 5) or (has_keyword and time_lines >= 2)


# -------- データ構造 --------
@dataclass
class SetlistComment:
    author_name: str
    author_channel_id: str
    text: str
    timestamp_lines: int
    like_count: int


@dataclass
class VideoSetlist:
    video_id: str
    video_url: str
    published_at: Optional[str]  # 動画の公開日時 (ISO 8601)
    candidates: list[SetlistComment]
    best_comment: Optional[str]  # 最も信頼できるセトリコメント


# -------- YouTube API ヘルパ --------
def youtube_client(api_key: str):
    return build("youtube", "v3", developerKey=api_key)


def iter_playlist_video_ids(youtube, playlist_id: str) -> Iterable[str]:
    """プレイリストから全動画IDを取得"""
    page_token: Optional[str] = None
    while True:
        req = youtube.playlistItems().list(
            part="contentDetails",
            playlistId=playlist_id,
            maxResults=50,
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


def fetch_video_published_at(youtube, video_ids: list[str]) -> dict[str, Optional[str]]:
    """動画の公開日時を一括取得する（最大50件ずつ）"""
    result: dict[str, Optional[str]] = {}
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i + 50]
        resp = youtube.videos().list(
            part="snippet",
            id=",".join(batch),
            fields="items(id,snippet/publishedAt)",
        ).execute()
        for item in resp.get("items", []):
            result[item["id"]] = item["snippet"]["publishedAt"]
    # 取得できなかった動画はNone
    for vid in video_ids:
        if vid not in result:
            result[vid] = None
    return result


def fetch_setlist_comments(youtube, video_id: str, max_pages: int = 10) -> list[SetlistComment]:
    """
    動画のコメントからセトリっぽいものを全て取得。
    max_pagesを増やして見落としを減らす。
    """
    candidates: list[SetlistComment] = []
    page_token: Optional[str] = None

    for _ in range(max_pages):
        try:
            req = youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                maxResults=100,
                order="relevance",  # 関連度順（人気コメントが上に来やすい）
                textFormat="plainText",
                pageToken=page_token,
            )
            resp = req.execute()
        except HttpError as e:
            if e.resp.status == 403:
                # コメント無効の動画
                print(f"  [WARN] Comments disabled for {video_id}")
                break
            elif e.resp.status == 404:
                # 動画が見つからない（削除済み等）
                print(f"  [WARN] Video not found: {video_id}")
                break
            raise

        for th in resp.get("items", []):
            snip = th.get("snippet", {}).get("topLevelComment", {}).get("snippet", {})
            text = snip.get("textDisplay") or ""
            if not text:
                continue

            if looks_like_setlist(text):
                candidates.append(SetlistComment(
                    author_name=snip.get("authorDisplayName") or "",
                    author_channel_id=(snip.get("authorChannelId") or {}).get("value") or "",
                    text=text,
                    timestamp_lines=count_timestamp_lines(text),
                    like_count=snip.get("likeCount", 0),
                ))

        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    # タイムスタンプ行数 × いいね数でソート
    candidates.sort(key=lambda c: (c.timestamp_lines, c.like_count), reverse=True)
    return candidates


def main() -> None:
    youtube = youtube_client(API_KEY)

    # 既存のJSONがあれば読み込む（増分更新）
    results: dict[str, dict] = {}
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            results = json.load(f)
        print(f"Loaded {len(results)} existing entries from {OUTPUT_FILE}")

    # プレイリストIDを読み込む
    playlist_ids = load_playlist_ids(PLAYLISTS_FILE)
    print(f"Found {len(playlist_ids)} playlists in {PLAYLISTS_FILE}")

    # 全プレイリストから動画IDを収集
    all_video_ids: list[str] = []
    for pid in playlist_ids:
        print(f"Scanning playlist {pid}...")
        vids = list(iter_playlist_video_ids(youtube, pid))
        print(f"  -> {len(vids)} videos")
        all_video_ids.extend(vids)

    # 重複を除去（順序は保持）
    seen = set()
    unique_video_ids = []
    for vid in all_video_ids:
        if vid not in seen:
            seen.add(vid)
            unique_video_ids.append(vid)

    # 既に取得済みの動画はスキップ
    new_video_ids = [vid for vid in unique_video_ids if vid not in results]
    total = len(unique_video_ids)
    new_count = len(new_video_ids)

    print(f"\nTotal unique videos: {total}")
    print(f"Already fetched: {total - new_count}")
    print(f"New to fetch: {new_count}")

    # published_at が未取得の動画を補完（プレイリスト外の既存エントリも含む）
    all_known_vids = set(unique_video_ids) | set(results.keys())
    vids_missing_date = [vid for vid in all_known_vids if not results.get(vid, {}).get("published_at")]
    if vids_missing_date:
        print(f"\nFetching published_at for {len(vids_missing_date)} videos...")
        pub_dates = fetch_video_published_at(youtube, vids_missing_date)
        for vid, pub_at in pub_dates.items():
            if vid in results:
                results[vid]["published_at"] = pub_at
        dirty = True
    else:
        dirty = False

    if new_count == 0 and not dirty:
        print("Nothing new to fetch.")
    else:
        if new_count > 0:
            print(f"\nFetching setlists for {new_count} new videos...")
            # 新規動画の公開日時を一括取得
            pub_dates = fetch_video_published_at(youtube, new_video_ids)

            for i, vid in enumerate(new_video_ids, start=1):
                print(f"[{i}/{new_count}] {vid}...", end=" ")

                candidates = fetch_setlist_comments(youtube, vid, max_pages=10)

                video_data = VideoSetlist(
                    video_id=vid,
                    video_url=f"https://www.youtube.com/watch?v={vid}",
                    published_at=pub_dates.get(vid),
                    candidates=[asdict(c) for c in candidates],
                    best_comment=candidates[0].text if candidates else None,
                )

                results[vid] = asdict(video_data)

                if candidates:
                    print(f"found {len(candidates)} candidate(s), best has {candidates[0].timestamp_lines} timestamps")
                else:
                    print("NO SETLIST FOUND")

        # JSON出力
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

    # サマリー
    found = sum(1 for v in results.values() if v["best_comment"])
    missing = [vid for vid, v in results.items() if not v["best_comment"]]

    print(f"\n=== Summary ===")
    print(f"Total videos: {len(results)}")
    print(f"With setlist: {found}")
    print(f"Missing: {len(missing)}")
    if missing:
        print(f"Missing video IDs: {missing}")
    print(f"\nSaved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
