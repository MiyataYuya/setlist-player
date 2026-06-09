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
