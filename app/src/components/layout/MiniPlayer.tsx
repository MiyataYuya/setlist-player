import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import Paper from "@mui/material/Paper";
import { usePlayerStore, useCurrentSong } from "../../stores/playerStore";

export default function MiniPlayer() {
  const currentSong = useCurrentSong();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isPlayerOpen = usePlayerStore((s) => s.isPlayerOpen);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const playNext = usePlayerStore((s) => s.playNext);
  const openPlayer = usePlayerStore((s) => s.openPlayer);

  if (!currentSong || isPlayerOpen) return null;

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: "calc(56px + env(safe-area-inset-bottom, 0px))",
        left: 0,
        right: 0,
        zIndex: 1100,
      }}
      elevation={4}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1,
          py: 0.5,
          cursor: "pointer",
        }}
        onClick={() => openPlayer()}
      >
        <Avatar
          variant="rounded"
          src={currentSong.thumbnailUrl}
          sx={{ width: 40, height: 30, mr: 1 }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {currentSong.title}
          </Typography>
          {currentSong.artist && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {currentSong.artist}
            </Typography>
          )}
        </Box>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            playNext();
          }}
        >
          <SkipNextIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}
