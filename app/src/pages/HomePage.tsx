import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import { songPerformances } from "../data/songs";
import { usePlayerStore } from "../stores/playerStore";
import SongList from "../components/songs/SongList";

export default function HomePage() {
  const playSong = usePlayerStore((s) => s.playSong);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const isShuffle = usePlayerStore((s) => s.isShuffle);

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
          {songPerformances.length} 曲
        </Typography>
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
      <SongList songs={songPerformances} />
    </Box>
  );
}
