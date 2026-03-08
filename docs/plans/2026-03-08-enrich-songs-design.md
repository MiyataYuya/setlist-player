# 楽曲データ補完・正規化 設計

## 目的

`data/app_songs.csv` のアーティスト未入力 357 曲を MusicBrainz API で補完し、表記ゆれを修正する。既存ファイルは上書きしない。

## 処理フロー

1. `data/app_songs.csv` 読み込み
2. 曲ではないエントリを判定・除外
3. アーティスト名から注釈を `performance_note` カラムに分離
4. 表記ゆれ修正（パースエラー修正 + 公式表記統一マップ適用）
5. アーティスト未入力の曲を MusicBrainz API で検索・補完
6. 新規ファイルに出力

## 非曲エントリの判定ルール

- `?` / `？` で終わる（質問文）
- キーワード: `配信`, `トラブル`, `再開`, `セトリ`, `巻き戻`
- タイトルが40文字以上（会話文の可能性が高い）

## 表記ゆれ修正

- パースエラー: 末尾 `)` の除去（`"Aimyon)"` → `"Aimyon"`）
- タイポ: `"BUMP OF CHIKEN"` → `"BUMP OF CHICKEN"`, `"SEKAI NO OWAR"` → `"SEKAI NO OWARI"`, `"LAMP IN TARREN"` → `"LAMP IN TERREN"`
- ローマ字/日本語統一: 公式表記に統一するマップ（`"Aimyon"` → `"あいみょん"` 等）
- 注釈分離: `(初披露)`, `(サビだけ)`, `(ワンコーラス)` 等を `performance_note` に移動

## 出力

- `data/app_songs_enriched.csv` — `song_id, title, artist, performance_note`
- `data/enrichment_log.json` — 検索結果・判定理由のログ

## 技術選定

- MusicBrainz API（無料・キー不要、レート制限 1req/sec）
- `musicbrainzngs` Python ライブラリ
