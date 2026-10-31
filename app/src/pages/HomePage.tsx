import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { PILL_BUTTON_SX } from "../components/common/pillButtonSx";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import { songPerformances, streams } from "../data/songs";
import { formatJstDate } from "../data/jstDate";
import { usePlayerStore } from "../stores/playerStore";
import { usePlaylistStore } from "../stores/playlistStore";
import { useTagStore } from "../stores/tagStore";
import { useRecentSongs } from "../hooks/useRecentSongs";
import HomeSection from "../components/home/HomeSection";
import SongCard from "../components/songs/SongCard";
import PlaylistTile from "../components/home/PlaylistTile";
import { cleanStreamTitle } from "../data/streamTitle";
import SongList from "../components/songs/SongList";
import SortMenu from "../components/songs/SortMenu";
import ViewModeToggle from "../components/songs/ViewModeToggle";
import { playlistTileVariant, songCardVariant } from "../components/songs/cardGrid";
import { useSongViewMode } from "../hooks/useSongViewMode";
import type { SortOption } from "../components/songs/SortMenu";
import StreamList from "../components/songs/StreamList";
import TagFilter from "../components/songs/TagFilter";

type ViewMode = "stream" | "song";

/** 各グリッドに出す上限（最新配信だけは配信単位で完結するため打ち切らない） */
const GRID_LIMIT = 6;

export default function HomePage() {
  const playSong = usePlayerStore((s) => s.playSong);
  const shuffleQueue = usePlayerStore((s) => s.shuffleQueue);
  // 上限ちょうどしか取らないと「超過しているか」が判定できず、
  // 「すべて表示」が永久に出ない。1件多く取って判定する。
  const recentSongs = useRecentSongs(GRID_LIMIT + 1);
  const playlists = usePlaylistStore((s) => s.playlists);
  const latestStream = streams[0];
  const songViewMode = useSongViewMode();
  const cardVariant = songCardVariant(songViewMode);
  const tileVariant = playlistTileVariant(songViewMode);
  // 毎レンダーで新しい配列になると SongCard の memo が効かないので固定する
  const shownRecentSongs = useMemo(
    () => recentSongs.slice(0, GRID_LIMIT),
    [recentSongs]
  );
  const [viewMode, setViewMode] = useState<ViewMode>("song");
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const sortedSongs = useMemo(() => {
    let songs = [...songPerformances];

    if (selectedTags.length > 0) {
      const songTags = useTagStore.getState().songTags;
      songs = songs.filter((song) => {
        const tags = songTags[song.performanceId] ?? [];
        return selectedTags.every((tag) => tags.includes(tag));
      });
    }

    return songs.sort((a, b) => {
      switch (sortOption) {
        case "date-desc":
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        case "date-asc":
          return (
            new Date(a.publishedAt).getTime() -
            new Date(b.publishedAt).getTime()
          );
        case "title-asc":
          return a.title.localeCompare(b.title, "ja");
        case "title-desc":
          return b.title.localeCompare(a.title, "ja");
        case "artist-asc":
          return a.artist.localeCompare(b.artist, "ja");
        case "artist-desc":
          return b.artist.localeCompare(a.artist, "ja");
      }
    });
  }, [sortOption, selectedTags]);

  function handleToggleTag(tag: string): void {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  const handleShuffleAll = () => {
    const random = Math.floor(Math.random() * songPerformances.length);
    playSong(songPerformances[random], songPerformances);
    shuffleQueue();
  };

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Typography variant="h5">ホーム</Typography>
      </Box>

      {latestStream && (
        <HomeSection
          title="最新の配信"
          subtitle={`${cleanStreamTitle(latestStream.title)} ・ ${formatJstDate(
            latestStream.publishedAt
          )}`}
          itemCount={latestStream.songs.length}
        >
          {latestStream.songs.map((song) => (
            <SongCard
              key={song.performanceId}
              song={song}
              queue={latestStream.songs}
              variant={cardVariant}
            />
          ))}
        </HomeSection>
      )}

      <HomeSection
        title="最近再生した曲"
        itemCount={recentSongs.length}
        shownCount={GRID_LIMIT}
        seeAllPath="/library"
      >
        {shownRecentSongs.map((song) => (
          <SongCard
            key={song.performanceId}
            song={song}
            queue={shownRecentSongs}
            variant={cardVariant}
          />
        ))}
      </HomeSection>

      <HomeSection
        title="プレイリスト"
        itemCount={playlists.length}
        shownCount={GRID_LIMIT}
        seeAllPath="/library"
      >
        {playlists.slice(0, GRID_LIMIT).map((playlist) => (
          <PlaylistTile
            key={playlist.id}
            playlist={playlist}
            variant={tileVariant}
          />
        ))}
      </HomeSection>

      {/* コントロール類は中央カラム全幅に伸ばすと間延びするので幅を抑える */}
      <Box sx={{ px: 2, pb: 2, maxWidth: 560 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {viewMode === "song"
            ? `${songPerformances.length} 曲`
            : `${streams.length} 配信`}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              label="曲"
              variant={viewMode === "song" ? "filled" : "outlined"}
              onClick={() => setViewMode("song")}
            />
            <Chip
              label="配信"
              variant={viewMode === "stream" ? "filled" : "outlined"}
              onClick={() => setViewMode("stream")}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              startIcon={<ShuffleIcon fontSize="small" />}
              onClick={handleShuffleAll}
              sx={{ ...PILL_BUTTON_SX, flexShrink: 0 }}
            >
              シャッフル再生
            </Button>
            {viewMode === "song" && (
              <SortMenu value={sortOption} onChange={setSortOption} />
            )}
            <ViewModeToggle />
          </Box>
        </Box>
        {viewMode === "song" && (
          <TagFilter selectedTags={selectedTags} onToggle={handleToggleTag} />
        )}
      </Box>
      {viewMode === "song" ? (
        <SongList songs={sortedSongs} />
      ) : (
        <StreamList streams={streams} />
      )}
    </Box>
  );
}
