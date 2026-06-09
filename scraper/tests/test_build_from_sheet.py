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
