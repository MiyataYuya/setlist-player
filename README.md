# YouTube Setlist Parser

YouTubeのライブ配信動画のコメント欄からセットリスト（セトリ）を自動抽出し、曲名・タイムスタンプをCSVに整理するツールです。

## 必要なもの

- Python 3.14+
- [uv](https://docs.astral.sh/uv/)（パッケージマネージャー）
- YouTube Data API v3 のAPIキー

## セットアップ

```bash
# 依存関係のインストール
uv sync

# YouTube API キーを環境変数に設定
export YOUTUBE_API_KEY="YOUR_API_KEY"
```

## 使い方

### 1. プレイリストIDの設定

`playlists.txt` に対象のYouTubeプレイリストIDを1行ずつ記載します。`#` で始まる行はコメントとして無視されます。

```
PLHFH8D2X0VLRqo9RT_kTi7FQl6Z_YyLGB
PLHFH8D2X0VLTVodqUoPYmIIpXDpCSWTOy
```

### 2. セトリコメントの取得

```bash
uv run fetch_setlists.py
```

プレイリスト内の各動画のコメントを走査し、セトリっぽいコメントを `setlists_raw.json` に保存します。増分更新に対応しており、既に取得済みの動画はスキップされます。

### 3. 曲名のパースとCSV出力

```bash
uv run parse_setlists.py
```

`setlists_raw.json` をもとに曲名をパースし、以下のCSVを出力します。

| ファイル | 内容 |
|---|---|
| `song_performances.csv` | 曲名 × 動画のマッピング（タイムスタンプ付きURL含む） |
| `songs.csv` | ユニークな曲リストと演奏回数 |

## 出力ファイル

- **`setlists_raw.json`** — APIから取得した生データ（セトリ候補コメント一覧）
- **`song_performances.csv`** — 各動画で演奏された曲の一覧（`song_name`, `artist`, `video_id`, `video_url`, `start_time`, `end_time`）
- **`songs.csv`** — ユニークな曲名と演奏回数（`song_name`, `artist`, `play_count`）
