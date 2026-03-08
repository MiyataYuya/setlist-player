import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import RepeatIcon from "@mui/icons-material/Repeat";
import { usePlayerStore } from "../../stores/playerStore";

export default function PlayerControls() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const isRepeat = usePlayerStore((s) => s.isRepeat);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrev = usePlayerStore((s) => s.playPrev);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" gap={1}>
      <IconButton
        onClick={toggleShuffle}
        color={isShuffle ? "primary" : "default"}
      >
        <ShuffleIcon />
      </IconButton>

      <IconButton onClick={playPrev}>
        <SkipPreviousIcon />
      </IconButton>

      <IconButton
        onClick={togglePlay}
        sx={{
          bgcolor: "primary.main",
          color: "black",
          "&:hover": { bgcolor: "primary.light" },
          width: 56,
          height: 56,
        }}
      >
        {isPlaying ? (
          <PauseIcon fontSize="large" />
        ) : (
          <PlayArrowIcon fontSize="large" />
        )}
      </IconButton>

      <IconButton onClick={playNext}>
        <SkipNextIcon />
      </IconButton>

      <IconButton
        onClick={toggleRepeat}
        color={isRepeat ? "primary" : "default"}
      >
        <RepeatIcon />
      </IconButton>
    </Stack>
  );
}
