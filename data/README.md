# data/ — データファイル一覧

このディレクトリには、配信アーカイブから生成した楽曲・パフォーマンス・動画のデータが格納されています。すべてのCSVは `scraper/build_from_sheet.py` が手動キュレーションされた Google スプレッドシートから生成します。

## 生成パイプライン

```
scraper/sheet_source.xlsx  (Googleスプレッドシートからダウンロード)
   │  scraper/build_from_sheet.py
   │    - URL列のハイパーリンクから video_id と start_seconds を抽出
   │    - YouTube Data API v3 で動画メタデータを補完 (キャッシュ優先)
   │    - 削除/非公開動画は関連 performance ごと除外
   │    - end_seconds は同一動画内の次曲 start で自動補完
   ▼
app_songs.csv / app_songs_enriched.csv
app_performances.csv / app_videos.csv
song_performances.csv  (公開用)
```

実行方法はリポジトリルートの [`README.md`](../README.md#データパイプライン) を参照してください。

## ファイル詳細

### `song_performances.csv` — 公開用CSV

1パフォーマンス（=ある配信で1曲歌った記録）が1行。CSVだけでアプリを使わずに該当曲をYouTubeで直接視聴できるよう、人間可読のフォーマットで保持されています。

| カラム | 説明 |
|---|---|
| `song_name` | 曲名 |
| `artist` | アーティスト名 |
| `video_id` | YouTube動画ID |
| `video_url` | タイムスタンプ付き視聴URL（`https://youtu.be/{id}?t={秒}`） |
| `published_at` | 配信公開日時（ISO 8601） |
| `start_time` | 曲開始位置（`HH:MM:SS`） |
| `end_time` | 曲終了位置（`HH:MM:SS`） |

### アプリ用データ

アプリ（`app/`）が `vite.config.ts` の `csvDataPlugin` 経由で読み込むファイル群。

#### `app_songs_enriched.csv` — 曲マスタ

アプリが直接読む曲マスタ。後方互換のため旧スキーマ（`performance_note` 列）を維持していますが、シート由来のデータではこの列は常に空になります。

| カラム | 説明 |
|---|---|
| `song_id` | 曲ID（`song_0001` 形式） |
| `title` | 曲名 |
| `artist` | アーティスト名 |
| `performance_note` | 注釈（旧パイプライン互換用、現在は常に空） |

`app_songs.csv` は `performance_note` を抜いた同等のファイル（互換用に並行出力）。

#### `app_performances.csv` — パフォーマンス

| カラム | 説明 |
|---|---|
| `performance_id` | パフォーマンスID（`perf_0001` 形式） |
| `song_id` | `app_songs_enriched.csv` への参照 |
| `video_id` | `app_videos.csv` への参照 |
| `start_seconds` | 曲開始位置（秒） |
| `end_seconds` | 曲終了位置（秒、同一動画内の次曲開始秒で自動補完） |
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

## 旧パイプライン由来の中間ファイル

`scraper/setlists_raw.json` は旧パイプライン（コメント解析）の出力で、現在のアプリ用 CSV の生成元としては使用していません。

## 補足

配信者の権利保護のため、このリポジトリには音声・動画の本体は一切含まれません。再生は必ず YouTube IFrame Player API 経由で行われます。
