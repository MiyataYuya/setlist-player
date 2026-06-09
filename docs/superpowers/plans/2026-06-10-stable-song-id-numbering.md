# song_id 安定採番 + シート再生成 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `build_from_sheet.py` の song_id を出現順採番から台帳方式の安定採番へ改修し、最新シートからデータCSVを再生成する。

**Architecture:** 既存 `app_songs.csv` を `{(title, artist): song_id}` の台帳として読み込み、既存曲は ID を固定、新曲のみ「台帳の最大番号 + 1」で末尾採番する。出力は song_id 昇順にソートして既存行の並びを保つ。配信追加で既存 ID がずれないことを単体テスト・冪等性・実データ照合で検証する。

**Tech Stack:** Python 3.14 / uv / pytest / openpyxl、データCSV（`data/app_*.csv`, `data/song_performances.csv`）

---

## File Structure

- Modify: `scraper/build_from_sheet.py` — 採番ロジック（`assign_song_ids`、`build`）と補助関数
- Modify: `scraper/pyproject.toml` — pytest / openpyxl を依存に追加、pytest 設定
- Create: `scraper/conftest.py` — pytest が `build_from_sheet` を import できるようにする（空ファイル）
- Create: `scraper/tests/test_build_from_sheet.py` — 採番ロジックの単体テスト
- Regenerate: `data/app_songs.csv`, `data/app_songs_enriched.csv`, `data/app_performances.csv`, `data/app_videos.csv`, `data/song_performances.csv`

---

## Task 1: テスト基盤の整備

**Files:**
- Modify: `scraper/pyproject.toml`
- Create: `scraper/conftest.py`

- [ ] **Step 1: 依存とテスト設定を追加**

`scraper/` で実行:

```bash
cd scraper
uv add openpyxl
uv add --dev pytest
```

- [ ] **Step 2: pyproject.toml に pytest 設定を追記**

`scraper/pyproject.toml` の末尾に追加（`pythonpath` で `build_from_sheet` を import 可能にする）:

```toml
[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]
```

- [ ] **Step 3: conftest.py を作成**

`scraper/conftest.py`（空でよい。pytest の rootdir を scraper に固定する役割）:

```python
# pytest rootdir マーカー。scraper/ をテストのルートに固定する。
```

- [ ] **Step 4: テストが収集できることを確認**

Run: `cd scraper && uv run pytest -q`
Expected: `no tests ran`（エラーなく収集が走ればよい）

- [ ] **Step 5: Commit**

```bash
git add scraper/pyproject.toml scraper/uv.lock scraper/conftest.py
git commit -m "chore(scraper): pytest と openpyxl を依存に追加しテスト基盤を整備"
```

---

## Task 2: 補助関数 `_song_num` と `load_song_registry`

**Files:**
- Modify: `scraper/build_from_sheet.py`
- Create: `scraper/tests/test_build_from_sheet.py`

- [ ] **Step 1: 失敗するテストを書く**

`scraper/tests/test_build_from_sheet.py`:

```python
from build_from_sheet import _song_num, load_song_registry


def test_song_num_parses_zero_padded():
    assert _song_num("song_0123") == 123
    assert _song_num("song_0001") == 1


def test_song_num_invalid_returns_negative():
    assert _song_num("garbage") == -1
    assert _song_num("") == -1


def test_load_registry_reads_title_artist_to_id(tmp_path):
    p = tmp_path / "app_songs.csv"
    p.write_text(
        "song_id,title,artist\nsong_0003,Foo,Bar\nsong_0007,Baz,\n",
        encoding="utf-8",
    )
    reg = load_song_registry(str(p))
    assert reg == {("Foo", "Bar"): "song_0003", ("Baz", ""): "song_0007"}


def test_load_registry_missing_file_returns_empty(tmp_path):
    assert load_song_registry(str(tmp_path / "nope.csv")) == {}
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `cd scraper && uv run pytest tests/test_build_from_sheet.py -q`
Expected: FAIL（`ImportError: cannot import name '_song_num'`）

- [ ] **Step 3: 最小実装を追加**

`scraper/build_from_sheet.py` の `assign_song_ids` の直前（現 116 行目あたり）に追加:

```python
def _song_num(song_id: str) -> int:
    """'song_0123' から数値 123 を取り出す。形式不一致は -1。"""
    m = re.match(r"song_(\d+)$", song_id or "")
    return int(m.group(1)) if m else -1


def load_song_registry(path: str) -> dict[tuple[str, str], str]:
    """既存 app_songs.csv から {(title, artist): song_id} の台帳を読む。

    ファイルが無ければ空 dict（初回実行・後方互換）。
    """
    registry: dict[tuple[str, str], str] = {}
    if not os.path.exists(path):
        return registry
    with open(path, "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            sid = row.get("song_id")
            if not sid:
                continue
            registry[(row.get("title", ""), row.get("artist", ""))] = sid
    return registry
```

- [ ] **Step 4: テストが通ることを確認**

Run: `cd scraper && uv run pytest tests/test_build_from_sheet.py -q`
Expected: PASS（4 passed）

- [ ] **Step 5: Commit**

```bash
git add scraper/build_from_sheet.py scraper/tests/test_build_from_sheet.py
git commit -m "feat(scraper): song_id 数値パースと台帳読み込み関数を追加"
```

---

## Task 3: `assign_song_ids` を台帳方式へ改修

**Files:**
- Modify: `scraper/build_from_sheet.py:116-133`（現 `assign_song_ids`）
- Modify: `scraper/tests/test_build_from_sheet.py`

- [ ] **Step 1: 失敗するテストを追記**

`scraper/tests/test_build_from_sheet.py` の末尾に追加:

```python
from build_from_sheet import assign_song_ids


def _rows(*pairs):
    return [{"title": t, "artist": a} for t, a in pairs]


def test_existing_id_is_preserved_regardless_of_order():
    reg = {("A", "x"): "song_0005", ("B", "y"): "song_0006"}
    m, songs = assign_song_ids(_rows(("B", "y"), ("A", "x")), reg)
    assert m[("A", "x")] == "song_0005"
    assert m[("B", "y")] == "song_0006"


def test_new_song_gets_max_plus_one():
    reg = {("A", "x"): "song_0005"}
    m, _ = assign_song_ids(_rows(("A", "x"), ("New", "z")), reg)
    assert m[("New", "z")] == "song_0006"


def test_new_song_uses_max_not_count_when_gaps_exist():
    # 欠番 (0002-0004) があっても max(5)+1 で採番し、詰めない
    reg = {("A", "x"): "song_0001", ("B", "y"): "song_0005"}
    m, _ = assign_song_ids(_rows(("A", "x"), ("B", "y"), ("New", "z")), reg)
    assert m[("New", "z")] == "song_0006"


def test_multiple_new_songs_numbered_in_input_order():
    reg = {("A", "x"): "song_0010"}
    m, _ = assign_song_ids(_rows(("First", "p"), ("Second", "q")), reg)
    assert m[("First", "p")] == "song_0011"
    assert m[("Second", "q")] == "song_0012"


def test_empty_registry_numbers_sequentially_from_one():
    m, _ = assign_song_ids(_rows(("A", "x"), ("B", "y")), {})
    assert m[("A", "x")] == "song_0001"
    assert m[("B", "y")] == "song_0002"
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `cd scraper && uv run pytest tests/test_build_from_sheet.py -q`
Expected: FAIL（`assign_song_ids() takes 1 positional argument but 2 were given`）

- [ ] **Step 3: `assign_song_ids` を置き換える**

`scraper/build_from_sheet.py` の現 `assign_song_ids`（116-133 行）を以下で置換:

```python
def assign_song_ids(
    perf_rows: list[dict],
    existing_registry: dict[tuple[str, str], str],
) -> tuple[dict[tuple[str, str], str], list[dict]]:
    """(title, artist) を song_id にマップ（台帳方式の安定採番）。

    既存台帳にある曲は song_id を固定。新曲のみ (台帳 + 当回採番済み) の
    最大番号 + 1 で末尾採番する（欠番は詰めない）。新曲の採番順は
    perf_rows の並び順（呼び出し側で date, no 昇順に整列して渡す）。
    """
    song_id_map: dict[tuple[str, str], str] = {}
    songs: list[dict] = []
    next_num = max(
        (_song_num(sid) for sid in existing_registry.values()), default=0
    )
    for r in perf_rows:
        key = (r["title"], r["artist"])
        if key in song_id_map:
            continue
        sid = existing_registry.get(key)
        if sid is None:
            next_num += 1
            sid = f"song_{next_num:04d}"
        song_id_map[key] = sid
        songs.append({"song_id": sid, "title": r["title"], "artist": r["artist"]})
    return song_id_map, songs
```

- [ ] **Step 4: テストが通ることを確認**

Run: `cd scraper && uv run pytest -q`
Expected: PASS（全テスト green、9 passed）

- [ ] **Step 5: Commit**

```bash
git add scraper/build_from_sheet.py scraper/tests/test_build_from_sheet.py
git commit -m "feat(scraper): assign_song_ids を台帳方式の安定採番に変更"
```

---

## Task 4: `build()` を台帳方式に配線（リナンバリング廃止・出力ソート）

**Files:**
- Modify: `scraper/build_from_sheet.py`（`build` 関数: 現 202-319 行）

- [ ] **Step 1: 採番呼び出しを台帳渡しに変更**

`scraper/build_from_sheet.py` の現 206-208 行:

```python
    perf_rows = extract_sheet_rows(xlsx_path)
    print(f"  {len(perf_rows)} performance rows extracted")

    # song_id 採番
    song_id_map, songs = assign_song_ids(perf_rows)
```

を以下に置換（新曲採番順を決定的にするため先に date, no 昇順へ整列し、台帳を渡す）:

```python
    perf_rows = extract_sheet_rows(xlsx_path)
    print(f"  {len(perf_rows)} performance rows extracted")

    # 新曲採番順を決定的にするため (date, no) 昇順に整列してから採番
    perf_rows.sort(key=lambda r: (r["date"], r["no"]))

    # song_id 採番（既存 app_songs.csv を台帳として既存 ID を固定）
    existing_registry = load_song_registry(OUT_SONGS)
    print(f"  Song registry: {len(existing_registry)} entries")
    song_id_map, songs = assign_song_ids(perf_rows, existing_registry)
```

- [ ] **Step 2: 削除動画除外時のリナンバリングを廃止**

現 235-243 行の「song_id を振り直し」ブロック:

```python
        # 除外で参照されなくなった曲は songs からも削除
        used_song_keys = {(r["title"], r["artist"]) for r in perf_rows}
        songs = [s for s in songs if (s["title"], s["artist"]) in used_song_keys]
        # song_id を振り直し (歯抜けを避ける)
        song_id_map = {}
        renumbered_songs = []
        for s in songs:
            sid = f"song_{len(song_id_map) + 1:04d}"
            song_id_map[(s["title"], s["artist"])] = sid
            renumbered_songs.append({"song_id": sid, "title": s["title"], "artist": s["artist"]})
        songs = renumbered_songs
        print(f"  除外後: songs={len(songs)}, perfs={len(perf_rows)}, videos={len(video_ids)}", file=sys.stderr)
```

を以下に置換（フィルタのみ。既存 ID は固定、欠番許容）:

```python
        # 除外で参照されなくなった曲は songs からも削除（ID は振り直さない＝欠番許容）
        used_song_keys = {(r["title"], r["artist"]) for r in perf_rows}
        songs = [s for s in songs if (s["title"], s["artist"]) in used_song_keys]
        print(f"  除外後: songs={len(songs)}, perfs={len(perf_rows)}, videos={len(video_ids)}", file=sys.stderr)
```

- [ ] **Step 3: 出力直前で songs を song_id 昇順にソート**

現 263-264 行:

```python
    # CSV 出力
    os.makedirs(_DATA_DIR, exist_ok=True)
```

の直前に追加:

```python
    # 出力行順を安定させる（既存行の並びを保ち、新曲は末尾に並ぶ）
    songs.sort(key=lambda s: _song_num(s["song_id"]))

    # CSV 出力
    os.makedirs(_DATA_DIR, exist_ok=True)
```

- [ ] **Step 4: 構文チェック**

Run: `cd scraper && uv run python -c "import build_from_sheet"`
Expected: エラーなく終了（exit 0）

- [ ] **Step 5: Commit**

```bash
git add scraper/build_from_sheet.py
git commit -m "feat(scraper): build を台帳方式に配線しリナンバリングを廃止"
```

---

## Task 5: 最新シートからデータCSVを再生成

**Files:**
- Regenerate: `data/app_songs.csv`, `data/app_songs_enriched.csv`, `data/app_performances.csv`, `data/app_videos.csv`, `data/song_performances.csv`

- [ ] **Step 1: 再生成を実行**

`YOUTUBE_API_KEY` が設定済みであることを前提に実行（PowerShell）:

```powershell
cd scraper
uv run python build_from_sheet.py
```

Expected: 末尾に `Songs: ... Performances: ... Videos: ...` のサマリが表示され、エラー終了しない。
`Song registry: 720 entries` のように既存台帳件数が出る。

- [ ] **Step 2: 差分の概形を確認（コミットはまだしない）**

Run: `git diff --stat data/`
Expected: `app_songs.csv` の変更が「末尾に新曲が追加された」程度に収まる（既存行の song_id が総入れ替えされていない）。

---

## Task 6: 安定採番の検証（実データ照合 + 冪等性）

**Files:** なし（検証のみ）

- [ ] **Step 1: 実データ照合 — 既存 song_id が1件もずれていないことを証明**

再生成後の作業ツリーと、コミット済み（HEAD）の `app_songs.csv` を比較する。Bash ツールで実行:

```bash
python - <<'PY'
import csv, io, subprocess
def load(text):
    return {(r["title"], r["artist"]): r["song_id"]
            for r in csv.DictReader(io.StringIO(text))}
old = load(subprocess.run(
    ["git", "show", "HEAD:data/app_songs.csv"],
    capture_output=True, text=True, encoding="utf-8").stdout)
with open("data/app_songs.csv", encoding="utf-8") as f:
    new = load(f.read())
common = [k for k in old if k in new]
shifted = [(k, old[k], new[k]) for k in common if old[k] != new[k]]
added = [k for k in new if k not in old]
removed = [k for k in old if k not in new]
print(f"old={len(old)} new={len(new)} common={len(common)} "
      f"shifted={len(shifted)} added={len(added)} removed={len(removed)}")
for s in shifted[:20]:
    print("SHIFTED:", s)
assert not shifted, f"{len(shifted)} 件の song_id がずれています（安定採番失敗）"
print("OK: 既存 song_id はすべて固定されています")
PY
```

Expected: `shifted=0` と `OK: 既存 song_id はすべて固定されています`。`added` は新曲数、`removed` は削除/非公開で落ちた曲数。

- [ ] **Step 2: 冪等性 — 2回目の実行で出力が変わらないこと**

Bash ツールで実行（1回目の出力を index に退避 → 2回目実行 → 差分ゼロを確認）:

```bash
git add data/ && \
(cd scraper && uv run python build_from_sheet.py) && \
git diff --stat data/
```

Expected: `git diff --stat data/` が**空**（2回目の出力が1回目と完全一致 = 冪等）。

- [ ] **Step 3: 照合に失敗した場合**

`shifted > 0` の場合は Task 3/4 の実装を見直す（台帳読み込みのキー不一致、ソート漏れ等）。検証が通るまでコミットしない。

---

## Task 7: アプリ側のビルド・テスト検証

**Files:** なし（検証のみ）

- [ ] **Step 1: 型チェック + ビルド（データはビルド時に取り込まれる）**

Run: `cd app && npm run build`
Expected: tsc 型チェックと Vite ビルドが成功（exit 0）。

- [ ] **Step 2: 全テスト実行**

Run: `cd app && npm run test`
Expected: 全 Vitest テストが PASS。

- [ ] **Step 3: lint**

Run: `cd app && npm run lint`
Expected: エラーなし。

---

## Task 8: 再生成データをコミット

**Files:**
- `data/app_songs.csv`, `data/app_songs_enriched.csv`, `data/app_performances.csv`, `data/app_videos.csv`, `data/song_performances.csv`

- [ ] **Step 1: データをコミット**

```bash
git add data/
git commit -m "data: 最新シートから再生成（安定採番・2026-06-05 配信反映）"
```

Note: `sheet_source.xlsx` は `.gitignore` 済みのためコミットに含まれない。

- [ ] **Step 2: 最終確認**

Run: `git log --oneline -6`
Expected: 設計・テスト基盤・補助関数・採番改修・build 配線・データ再生成のコミットが並ぶ。

---

## Self-Review 結果

- **Spec coverage:** 台帳方式採番（Task 2-3）/ build 配線・リナンバリング廃止（Task 4）/ シート再生成（Task 5）/ 単体テスト(a)（Task 2-3）/ 実データ照合(c)・冪等性(b)（Task 6）/ アプリ検証(d)（Task 7）— 全要件にタスク対応あり。
- **Placeholder scan:** プレースホルダなし。全ステップに実コード・実コマンドを記載。
- **Type consistency:** `assign_song_ids(perf_rows, existing_registry)`、`load_song_registry(path)`、`_song_num(song_id)` のシグネチャは全タスクで一致。`song_id_map` / `songs` の戻り値構造も従来と同一。
