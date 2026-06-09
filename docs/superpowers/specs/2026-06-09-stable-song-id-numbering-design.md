# song_id 安定採番 + シート再生成 設計

- 日付: 2026-06-09
- 対象: `scraper/build_from_sheet.py`、`data/app_*.csv` / `data/song_performances.csv`
- ブランチ: `feature/stable-song-id-numbering`（`main` から派生）

## 背景・問題

`build_from_sheet.py` の `assign_song_ids` は `perf_rows` の**出現順**で `song_0001…` を採番する。
シートは新しい配信を先頭行に追加する構造のため、配信が1本増えるたびに先頭から全曲の
`song_id` がシフトし、`app_songs.csv` / `app_performances.csv` の text 差分が数千行に膨張する。
差分の実体は「曲のラベル（song_id）の振り直し」だけで、楽曲・演奏の中身は変わっていない。

加えて、削除/非公開動画の除外時に「歯抜け回避」で song_id を振り直す処理（現 235–242 行）も、
既存 ID をずらす方向に働く。

このノイズを排し、**配信追加で既存 song_id がずれない「安定採番」**へ改修し、
最新シート（`sheet_source.xlsx`、2026-06-05 配信を含む）から現 `main` 上で全データCSVを再生成する。

## ゴール

1. `song_id` を台帳方式の安定採番にする
2. 最新シートからデータCSVを再生成する（＝「正解のCSV」でデータを更新）
3. 既存 song_id が1つもずれていないことを検証可能にする

## 方針：台帳（レジストリ）方式

採番の唯一の根拠を「既存 `app_songs.csv`」に置く。

- 既存 `app_songs.csv` から `{(title, artist): song_id}` の台帳を読み込む
- 各 (曲名, アーティスト) について:
  - 台帳にあれば → 既存 `song_id` を**再利用（固定）**
  - 新曲なら → `次番号 = (台帳 + 当回採番済み) の最大数値 + 1`。欠番があっても**詰めない**
- 新曲が複数あるときの採番順は **初出演奏の (date, no) 昇順**（決定的・直感的）
- 台帳が空（初回 / ファイル無し）→ 従来どおり `song_0001` からの連番（後方互換）

### 採番の例

```
既存台帳: song_0001 雨とカプチーノ / ヨルシカ      → song_0001 のまま
         song_0002 怪獣 / サカナクション           → song_0002 のまま
         ...
         song_0720 二息歩行 / DECO*27              → song_0720 のまま
新曲:     (新規 title/artist)                       → song_0721, song_0722, ...（初出順）
削除曲:   出力から外すが番号は詰めない（欠番 OK）
```

## 変更箇所

### 1. `assign_song_ids` を台帳方式へ

新シグネチャ:

```python
def assign_song_ids(
    perf_rows: list[dict],
    existing_registry: dict[tuple[str, str], str],
) -> tuple[dict[tuple[str, str], str], list[dict]]:
```

- `existing_registry` を起点に、新曲のみ末尾採番
- 戻り値は従来どおり `(song_id_map, songs)`。`songs` は出力順を維持
- 数値抽出ヘルパ `_song_num(song_id) -> int`（`"song_0123"` → `123`）を用意

### 2. `load_song_registry(path)` 新設

`app_songs.csv` を読み、`{(title, artist): song_id}` を返す。ファイル無しは空 dict。

### 3. `build()` の修正

- `assign_song_ids(perf_rows)` の呼び出しを `load_song_registry(OUT_SONGS)` の結果を渡す形に
- 削除動画の除外後（現 235–242 行）の**リナンバリングを廃止**。
  演奏されなくなった曲を `songs` から外すフィルタのみ残し、残存曲の ID は固定（欠番許容）

## 検証

### (a) 単体テスト（pytest 新設）

`scraper/tests/test_build_from_sheet.py`:

1. 台帳にある曲は既存 song_id を保持する
2. 新曲は (台帳の最大番号 + 1) を得る
3. 欠番がある台帳でも詰めず、最大+1 で採番する
4. 新曲が複数あるとき採番順が初出 (date, no) で決定的になる
5. 空台帳では song_0001 から連番（後方互換）

### (b) 冪等性

`build` を2回連続で実行し、2回目の出力が git diff ゼロであること。

### (c) 実データ照合（安定採番の証明）

再生成前後の `app_songs.csv` を比較し、**両方に存在する全 (曲名, アーティスト) の song_id が完全一致**することを
スクリプトで検証する。1件でもずれていれば失敗とみなす。

### (d) アプリ検証

`cd app && npm run build && npm run test`（データはビルド時に取り込まれる）。

## ツール

- `scraper/pyproject.toml` に dev 依存として `pytest` を追加（`uv add --dev pytest`）
- `scraper/tests/` を新設

## 既知の制限

動画削除で曲が台帳から落ちると、後で復活した際は新番号になる（旧 ID は戻らない）。
YAGNI として許容。必要になれば将来、出力 CSV とは別の永続台帳ファイルを導入する。

## 非対象（スコープ外）

- 旧パイプライン（`fetch/parse/build/enrich`）の変更
- `perf_id` の採番ロジック（既に date ソートで安定）
- アプリ側コードの変更
