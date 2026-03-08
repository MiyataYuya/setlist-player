# セトリプレイヤー

YouTubeの歌枠配信のコメント欄からセットリスト（セトリ）を自動抽出し、曲単位で再生できるWebアプリです。

視聴者が投稿したセトリコメントを情報源として活用し、曲名・タイムスタンプを構造化データに変換します。

https://miyatayuya.github.io/setlist-player/

## 構成

```
scraper/   セトリ取得・パース・アプリ用データ生成
data/      生成されたCSVデータ
app/       Webアプリ（React + Vite）
```

## 必要なもの

- Python 3.14+ / [uv](https://docs.astral.sh/uv/)
- Node.js / npm
- YouTube Data API v3 のAPIキー

## データ取得（scraper）

```bash
cd scraper
uv sync
export YOUTUBE_API_KEY="YOUR_API_KEY"
```

### 1. セトリコメントの取得

```bash
uv run fetch_setlists.py
```

`playlists.txt` に記載されたプレイリスト内の各動画のコメントを走査し、セトリコメントを `setlists_raw.json` に保存します。増分更新対応。

### 2. 曲名のパース

```bash
uv run parse_setlists.py
```

セトリコメントをパースし、`data/song_performances.csv` と `data/songs.csv` を出力します。

### 3. アプリ用データの生成

```bash
uv run build_app_data.py
```

タイムスタンプの秒数変換、曲名の表記揺れ統一、ID採番などを行い、以下のファイルを `data/` に出力します。

| ファイル | 内容 |
|---|---|
| `app_songs.csv` | 曲マスタ（song_id, title, artist） |
| `app_performances.csv` | パフォーマンス（performance_id, song_id, video_id, start_seconds, end_seconds） |
| `app_videos.csv` | 動画情報（video_id, title, duration, view_count 等） |

## Webアプリ（app）

```bash
cd app
npm install
npm run dev
```

### 機能

- 曲一覧・配信一覧の切り替え表示
- 曲名・アーティスト名での検索
- YouTube埋め込みプレイヤーによる曲単位の再生
- シャッフル再生
- 無限スクロール
