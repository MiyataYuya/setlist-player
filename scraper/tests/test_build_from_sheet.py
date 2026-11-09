from build_from_sheet import _song_num, annotate_history, extract_sheet_rows, load_song_registry, parse_style


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


def test_assign_song_ids_ignores_broken_id_in_registry():
    """台帳に壊れた song_id が混在しても有効な最大番号+1で採番する。"""
    reg = {("Broken", "x"): "garbage", ("Good", "y"): "song_0003"}
    m, _ = assign_song_ids(_rows(("Broken", "x"), ("Good", "y"), ("New", "z")), reg)
    assert m[("New", "z")] == "song_0004"


def test_assign_song_ids_all_broken_registry_starts_from_one():
    """台帳が全件壊れていても song_0001 から採番する（song_0000 を生成しない）。"""
    reg = {("A", "x"): "garbage"}
    m, _ = assign_song_ids(_rows(("A", "x"), ("New", "z")), reg)
    assert m[("New", "z")] == "song_0001"


# --- 演奏スタイル（F列の 🎸/🎤）---

def test_parse_style_guitar():
    assert parse_style("🎸") == "guitar"


def test_parse_style_karaoke():
    assert parse_style("🎤") == "karaoke"


def test_parse_style_tolerates_surrounding_spaces():
    assert parse_style(" 🎸 ") == "guitar"


def test_parse_style_unknown_marks_are_empty():
    # 🔒（メンバー限定と思われる）や空欄は分類しない
    assert parse_style("🔒") == ""
    assert parse_style(None) == ""
    assert parse_style("") == ""


def _write_sheet(path, rows):
    """extract_sheet_rows が読む形（先頭シート・DATA_START_ROW 以降）の xlsx を作る。"""
    import openpyxl
    from build_from_sheet import (
        COL_ARTIST, COL_DATE, COL_MODE, COL_NO, COL_TITLE, COL_URL, DATA_START_ROW,
    )

    wb = openpyxl.Workbook()
    ws = wb.active
    for i, (title, mode, url) in enumerate(rows):
        r = DATA_START_ROW + i
        ws.cell(row=r, column=COL_DATE, value="2026-01-01 20:00:00")
        ws.cell(row=r, column=COL_NO, value=i + 1)
        ws.cell(row=r, column=COL_TITLE, value=title)
        ws.cell(row=r, column=COL_ARTIST, value="アーティスト")
        ws.cell(row=r, column=COL_MODE, value=mode)
        cell = ws.cell(row=r, column=COL_URL, value="配信タイトル")
        if url:
            cell.hyperlink = url
    wb.save(path)


def test_extract_sheet_rows_reads_style_per_row(tmp_path):
    path = tmp_path / "sheet.xlsx"
    _write_sheet(path, [
        ("曲A", "🎸", "https://www.youtube.com/watch?v=AAAAAAAAAAA&t=10s"),
        ("曲B", "🎤", "https://www.youtube.com/watch?v=AAAAAAAAAAA&t=300s"),
    ])
    rows = extract_sheet_rows(str(path))
    assert [r["style"] for r in rows] == ["guitar", "karaoke"]


# --- 歌唱履歴（何回目か・前回からの間隔）---

def _hist(title, date, no=1, artist="A"):
    return {"title": title, "artist": artist, "date": date, "no": no}


def test_annotate_history_numbers_each_song_in_date_order():
    rows = [
        _hist("曲A", "2026-03-01 20:00:00"),
        _hist("曲A", "2026-01-01 20:00:00"),
        _hist("曲B", "2026-02-01 20:00:00"),
    ]
    annotate_history(rows)
    by = {(r["title"], r["date"][:10]): r for r in rows}
    assert by[("曲A", "2026-01-01")]["nth"] == 1
    assert by[("曲A", "2026-03-01")]["nth"] == 2
    assert by[("曲B", "2026-02-01")]["nth"] == 1


def test_annotate_history_gap_days_since_previous_performance():
    rows = [
        _hist("曲A", "2026-01-01 20:00:00"),
        _hist("曲A", "2026-03-02 23:30:00"),
    ]
    annotate_history(rows)
    assert rows[0]["gap_days"] is None
    assert rows[1]["gap_days"] == 60


def test_annotate_history_orders_same_day_by_setlist_number():
    rows = [
        _hist("曲A", "2026-01-01 20:00:00", no=5),
        _hist("曲A", "2026-01-01 20:00:00", no=2),
    ]
    annotate_history(rows)
    assert [r["nth"] for r in rows] == [2, 1]
    assert rows[0]["gap_days"] == 0


def test_annotate_history_treats_artist_as_part_of_the_song():
    rows = [
        _hist("同名曲", "2026-01-01 20:00:00", artist="X"),
        _hist("同名曲", "2026-02-01 20:00:00", artist="Y"),
    ]
    annotate_history(rows)
    assert [r["nth"] for r in rows] == [1, 1]


def test_extract_sheet_rows_counts_rows_without_a_link_in_history(tmp_path):
    # リンクの無い行（メンバー限定など）は出力しないが、回数・間隔には数える
    path = tmp_path / "sheet.xlsx"
    _write_sheet(path, [
        ("曲A", "🎸", "https://www.youtube.com/watch?v=AAAAAAAAAAA&t=10s"),
        ("曲A", "🔒", None),
    ])
    import openpyxl
    from build_from_sheet import COL_DATE, DATA_START_ROW
    wb = openpyxl.load_workbook(path)
    ws = wb.active
    ws.cell(row=DATA_START_ROW, column=COL_DATE, value="2026-02-01 20:00:00")
    ws.cell(row=DATA_START_ROW + 1, column=COL_DATE, value="2026-01-01 20:00:00")
    wb.save(path)

    rows = extract_sheet_rows(str(path))
    assert len(rows) == 1
    assert rows[0]["nth"] == 2
    assert rows[0]["gap_days"] == 31
