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
  const isRepeat = usePlayerStore((s) => s.isRepeat);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrev = usePlayerStore((s) => s.playPrev);
  const shuffleQueue = usePlayerStore((s) => s.shuffleQueue);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <IconButton
        onClick={shuffleQueue}
        size="large"
      >
        <ShuffleIcon sx={{ fontSize: 28 }} />
      </IconButton>

      <IconButton onClick={playPrev} size="large">
        <SkipPreviousIcon sx={{ fontSize: 40 }} />
      </IconButton>

      <IconButton
        onClick={togglePlay}
        sx={{
          bgcolor: "white",
          color: "black",
          "&:hover": { bgcolor: "grey.300" },
          width: 72,
          height: 72,
        }}
      >
        {isPlaying ? (
          <PauseIcon sx={{ fontSize: 40 }} />
        ) : (
          <PlayArrowIcon sx={{ fontSize: 40 }} />
        )}
      </IconButton>

      <IconButton onClick={playNext} size="large">
        <SkipNextIcon sx={{ fontSize: 40 }} />
      </IconButton>

      <IconButton
        onClick={toggleRepeat}
        color={isRepeat ? "primary" : "default"}
        size="large"
      >
        <RepeatIcon sx={{ fontSize: 28 }} />
      </IconButton>
    </Stack>
  );
}
