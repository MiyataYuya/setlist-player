import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import { songPerformances, streams } from "../data/songs";
import { usePlayerStore } from "../stores/playerStore";
import SongList from "../components/songs/SongList";
import StreamList from "../components/songs/StreamList";

type ViewMode = "stream" | "song";

export default function HomePage() {
  const playSong = usePlayerStore((s) => s.playSong);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const [viewMode, setViewMode] = useState<ViewMode>("song");

  const sortedSongs = useMemo(() => {
    return [...songPerformances].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }, []);

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
