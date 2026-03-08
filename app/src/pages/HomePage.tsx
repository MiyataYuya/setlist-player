import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import { songPerformances, streams } from "../data/songs";
import { usePlayerStore } from "../stores/playerStore";
import { useTagStore } from "../stores/tagStore";
import SongList from "../components/songs/SongList";
import SortMenu from "../components/songs/SortMenu";
import type { SortOption } from "../components/songs/SortMenu";
import StreamList from "../components/songs/StreamList";
import TagFilter from "../components/songs/TagFilter";

type ViewMode = "stream" | "song";

export default function HomePage() {
  const playSong = usePlayerStore((s) => s.playSong);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
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
    if (!isShuffle) toggleShuffle();
    const random = Math.floor(Math.random() * songPerformances.length);
    playSong(songPerformances[random], songPerformances);
  };

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          ホーム
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {viewMode === "song"
            ? `${songPerformances.length} 曲`
            : `${streams.length} 配信`}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
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
        {viewMode === "song" && (
          <SortMenu value={sortOption} onChange={setSortOption} />
        )}
        {viewMode === "song" && (
          <TagFilter selectedTags={selectedTags} onToggle={handleToggleTag} />
        )}
        <Button
          variant="contained"
          startIcon={<ShuffleIcon />}
          onClick={handleShuffleAll}
          fullWidth
          sx={{ mt: 1 }}
        >
          シャッフル再生
        </Button>
      </Box>
      {viewMode === "song" ? (
        <SongList songs={sortedSongs} />
      ) : (
        <StreamList streams={streams} />
      )}
    </Box>
  );
}
