# セトリプレイヤー

YouTubeの歌枠配信アーカイブから、有志の方が管理しているセットリスト（セトリ）情報をもとに曲単位で再生できるWebアプリです。

[ミナミイズミ (@IZUMIMINAMI)](https://www.youtube.com/@IZUMIMINAMI) さんの配信アーカイブからセトリを作りたかったのがきっかけで開発しました。セトリ情報は有志の方が公開している [Googleスプレッドシート（非公式）](https://docs.google.com/spreadsheets/d/1rZfXp7j8Qh_gAhWuIEgGBt9Z_Pbn0QXoCLExQc6OrNI/) を参照させていただき、構造化データに変換してアプリに取り込んでいます。データを公開してくださっている管理者の方に感謝いたします。

**Webアプリ:** https://miyatayuya.github.io/setlist-player/

**変更履歴:** [CHANGELOG.md](CHANGELOG.md)

## データの取り扱いについて

本プロジェクトは配信者の権利を尊重し、以下の方針でデータを取り扱っています。

### 音源・映像の非保存

音声ファイルや映像のダウンロード・再配布は一切行いません。再生にはYouTubeの公式埋め込みプレイヤー（IFrame Player API）を使用し、すべての再生はYouTube上で行われます。

### データソースの透明性

本アプリが扱うデータはすべて**公開情報のみ**から取得しています。

| データ | 取得元 | 方法 |
|---|---|---|
| セトリ（曲名・アーティスト・タイムスタンプ） | [有志の方が公開している Googleスプレッドシート（非公式）](https://docs.google.com/spreadsheets/d/1rZfXp7j8Qh_gAhWuIEgGBt9Z_Pbn0QXoCLExQc6OrNI/) | シートの URL 列に埋め込まれた `youtube.com/watch?v=...&t=Ns` リンクから `video_id` と開始秒数を抽出 |
| 動画メタデータ（タイトル・公開日等） | YouTube Data API v3 | 公式APIによる取得 |

> このスプレッドシートは本プロジェクトとは独立して、有志の方が管理されているものです。シートの管理者の方からの公開停止・利用停止のご要望があった場合は、速やかにアプリからの参照を停止します。

独自の解析（音声認識・歌詞照合等）は行っていません。

### データの正確性について

曲名・アーティスト名・タイムスタンプは手動キュレーションされたシートを「正」として取り込んでいるため、コメント解析時代に発生していた以下の誤りは原則発生しません。

- 投稿者の記載ミス
- パース処理での曲名区切りの誤認
- 自動マッチングによる別の同名曲のアーティストとの混同

それでも転記ミスや表記揺れが残る可能性はあります。誤りに気づいた場合は Issue でご報告いただけると助かります。

なお、配信者の権利保護として、YouTube から削除/非公開になった動画は API でタイトルが取得できないため、関連する曲データごと自動的にアプリから除外されます（[`scraper/build_from_sheet.py`](scraper/build_from_sheet.py)）。

### 保存するデータの範囲

保存するのは曲名・アーティスト名・タイムスタンプ・動画IDなどの**メタデータのみ**です。配信の音声・映像・コメント本文はリポジトリに含まれません。

### 削除要請について

配信者ご本人からデータの削除要請があった場合は、速やかに該当データの削除およびアプリからの除外を行います。Issue または連絡先よりご連絡ください。

### 楽曲一覧

全楽曲データは [`data/song_performances.csv`](data/song_performances.csv) で公開しています。

| カラム | 内容 |
|--------|------|
| `song_name` | 曲名 |
| `artist` | アーティスト名 |
| `video_id` | YouTube動画ID |
| `video_url` | タイムスタンプ付きYouTubeリンク |
| `published_at` | 配信日時 |
| `start_time` | 歌唱開始時刻 (HH:MM:SS) |
| `end_time` | 歌唱終了時刻 (HH:MM:SS) |

CSVの `video_url` をクリックすれば、アプリを使わずに該当の歌唱箇所をYouTubeで直接視聴できます。

## 構成

```
scraper/   セトリ取得・パース・データ補完
data/      生成されたCSVデータ
app/       Webアプリ（React + Vite）
docs/      仕様書・設計ドキュメント
```

## 必要なもの

- Python 3.14+ / [uv](https://docs.astral.sh/uv/)
- Node.js / npm
- YouTube Data API v3 のAPIキー

## データパイプライン

セトリ情報の正は Google スプレッドシートで手動キュレーションされています。`scraper/build_from_sheet.py` がシート（XLSX）のハイパーリンクから `video_id` と開始秒数を抽出し、アプリ用 CSV と公開用 CSV をすべて生成します。

```bash
cd scraper
uv sync
export YOUTUBE_API_KEY="YOUR_API_KEY"
```

### 1. シートのダウンロード

```bash
curl -sL "https://docs.google.com/spreadsheets/d/<SHEET_ID>/export?format=xlsx" \
  -o scraper/sheet_source.xlsx
```

`sheet_source.xlsx` はバイナリで頻繁に更新されるため `.gitignore` 済み。実行のたびに最新を取得してください。

### 2. CSV の生成

```bash
uv run build_from_sheet.py
```

シートから抽出した `(video_id, start_seconds, 曲名, アーティスト)` をもとに、以下のファイルを `data/` に出力します。

| ファイル | 内容 |
|---|---|
| `app_songs.csv` | 曲マスタ（`song_id`, `title`, `artist`） |
| `app_songs_enriched.csv` | アプリが読む曲マスタ（上記に `performance_note` 列を加えた互換スキーマ） |
| `app_performances.csv` | パフォーマンス（`performance_id`, `song_id`, `video_id`, `start_seconds`, `end_seconds`, `published_at`） |
| `app_videos.csv` | 動画情報（YouTube Data API v3 から取得・キャッシュ） |
| `song_performances.csv` | 公開用CSV（人間可読の `HH:MM:SS`、`video_url` 付き） |

動画末尾の曲の `end_seconds` は「同じ動画内の次曲の `start_seconds`」で自動補完し、最終曲のみ `+300秒` をフォールバックとします。

### 旧パイプライン（参考）

`fetch_setlists.py` → `parse_setlists.py` → `build_app_data.py` → `enrich_songs.py` はコメント解析ベースの旧パイプラインで、リポジトリには残置していますが現在アプリ用 CSV の生成元としては使用していません（コメント解析の誤検出問題が再発するため）。

## Webアプリ（app）

```bash
cd app
npm install
npm run dev
```

### 画面

| ホーム | 再生画面 | 検索 | ライブラリ |
|:---:|:---:|:---:|:---:|
| ![ホーム](img/screenshot_home.png) | ![再生画面](img/screenshot_player.png) | ![検索](img/screenshot_search.png) | ![ライブラリ](img/screenshot_library.png) |

### 機能

- 曲一覧・配信一覧の切り替え表示
- 曲名・アーティスト名での検索（デバウンス付き）
- YouTube埋め込みプレイヤーによる曲単位の再生
- シークバーによる再生位置の表示・操作
- シャッフル再生（キューの並び替え）
- リピート再生
- キュー表示（再生済み・現在・次の曲）
- お気に入り・タグ・プレイリスト管理
- 再生履歴
- 無限スクロール
- MiniPlayer（他の画面でも再生状態を維持）
