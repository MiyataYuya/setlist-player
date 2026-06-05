# data/ — データファイル一覧

このディレクトリには、YouTube配信アーカイブから生成した楽曲・パフォーマンス・動画のデータが格納されています。
すべてのCSVは `scraper/` 内のスクリプトによって生成されます。

## 生成パイプライン

```
playlists.txt
   │  fetch_setlists.py   … プレイリスト内動画のコメントを走査
   ▼
setlists_raw.json
   │  parse_setlists.py   … セトリコメントをパース
   ▼
songs.csv / song_performances.csv
   │  build_app_data.py   … 秒数変換・表記揺れ統一・ID採番
   ▼
app_songs.csv / app_performances.csv / app_videos.csv
   │  enrich_songs.py     … アーティスト名の補完・正規化
   ▼
app_songs_enriched.csv / enrichment_log.json
```

実行方法の詳細はリポジトリルートの [`README.md`](../README.md) の「データ生成パイプライン」を参照してください。
すべて `scraper/` ディレクトリで `uv run <スクリプト名>` として実行します。

## ファイル詳細

### 中間データ（パース直後）

#### `songs.csv`
`parse_setlists.py` が出力する曲ごとの集計。

| カラム | 説明 |
|---|---|
| `song_name` | 曲名（パース直後の生の表記） |
| `artist` | アーティスト名（未入力の場合あり） |
| `play_count` | 全配信を通じた歌唱回数 |

#### `song_performances.csv`
1パフォーマンス（=ある配信で1曲歌った記録）が1行。アプリ向けに加工する前の生データ。
全楽曲データの公開用ファイルとしてREADMEからリンクされている。

| カラム | 説明 |
|---|---|
| `song_name` | 曲名 |
| `artist` | アーティスト名（未入力の場合あり） |
| `video_id` | YouTube動画ID |
| `video_url` | タイムスタンプ付き視聴URL |
| `published_at` | 配信公開日時（ISO 8601） |
| `start_time` | 曲開始位置（`HH:MM:SS`） |
| `end_time` | 曲終了位置（`HH:MM:SS`、未入力の場合あり） |

> `end_time` は約65%が未入力のため、`build_app_data.py` では「次の曲の `start_time`」で代替している。詳細は [`docs/decisions.md`](../docs/decisions.md) を参照。

### アプリ用データ（`build_app_data.py` 出力）

タイムスタンプの秒数変換、曲名の表記揺れ統一、ID採番を行ったもの。

#### `app_songs.csv` — 曲マスタ

| カラム | 説明 |
|---|---|
| `song_id` | 曲ID（`song_0001` 形式） |
| `title` | 曲名 |
| `artist` | アーティスト名 |

#### `app_performances.csv` — パフォーマンス

| カラム | 説明 |
|---|---|
| `performance_id` | パフォーマンスID（`perf_0001` 形式） |
| `song_id` | `app_songs.csv` への参照 |
| `video_id` | `app_videos.csv` への参照 |
| `start_seconds` | 曲開始位置（秒） |
| `end_seconds` | 曲終了位置（秒） |
| `published_at` | 配信公開日時（ISO 8601） |

#### `app_videos.csv` — 動画情報

| カラム | 説明 |
|---|---|
| `video_id` | YouTube動画ID |
| `published_at` | 公開日時（ISO 8601） |
| `title` | 動画タイトル |
| `channel_title` | チャンネル名 |
| `duration` | 動画長（ISO 8601 duration、例 `PT1H16M6S`） |
| `view_count` | 再生数 |
| `like_count` | 高評価数 |

### 補完済みデータ（`enrich_songs.py` 出力）

`app_songs.csv` を入力に、非曲エントリの除外・表記ゆれ修正・MusicBrainz APIによるアーティスト補完などを行ったもの。
設計詳細は [`docs/plans/2026-03-08-enrich-songs-design.md`](../docs/plans/2026-03-08-enrich-songs-design.md) を参照。

#### `app_songs_enriched.csv` — 補完済み曲マスタ

| カラム | 説明 |
|---|---|
| `song_id` | 曲ID（`app_songs.csv` と対応） |
| `title` | 曲名 |
| `artist` | 補完・正規化済みアーティスト名 |
| `performance_note` | 「(初披露)」「(ワンコーラス)」等の注釈 |

#### `enrichment_log.json`
各曲の処理内容・判定理由（どの曲をどう補完・修正したか）を記録したログ。

## アプリでの利用

アプリが実際に読み込むのは次の3ファイル。`app/vite.config.ts` の `csvDataPlugin` がビルド時にパースし、
仮想モジュール（`virtual:songs`, `virtual:performances`, `virtual:videos`）として提供する。

- `app_songs_enriched.csv`
- `app_performances.csv`
- `app_videos.csv`

## 補足

- `*.csv.bak` は生成スクリプト実行時の自動バックアップ。
- 配信者の権利保護のため、このリポジトリには音声・動画の本体は一切含まれない。再生は必ずYouTube IFrame Player API経由で行われる。
