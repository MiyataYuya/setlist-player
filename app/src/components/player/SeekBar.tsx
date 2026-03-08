import { useState, useEffect, useRef, useCallback } from "react";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import { usePlayerStore, useCurrentSong, getPlayerRef } from "../../stores/playerStore";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SeekBar() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentSong = useCurrentSong();

  const [position, setPosition] = useState(0);
  const isDraggingRef = useRef(false);

  const duration =
    currentSong != null
      ? currentSong.endSeconds - currentSong.startSeconds
      : 0;

  useEffect(() => {
    if (!currentSong || !isPlaying) return;

    const intervalId = setInterval(() => {
      if (isDraggingRef.current) return;
      const player = getPlayerRef();
      if (!player) return;
      try {
        const time = player.getCurrentTime();
        const relative = Math.max(0, time - currentSong.startSeconds);
        setPosition(Math.min(relative, duration));
      } catch {
        // player not ready
      }
    }, 250);

    return () => clearInterval(intervalId);
  }, [currentSong, isPlaying, duration]);

  useEffect(() => {
    setPosition(0);
  }, [currentSong?.performanceId]);

  const handleChange = useCallback((_: Event, value: number | number[]) => {
    const v = typeof value === "number" ? value : value[0];
    isDraggingRef.current = true;
    setPosition(v);
  }, []);

  const handleChangeCommitted = useCallback(
    (_: Event | React.SyntheticEvent, value: number | number[]) => {
      const v = typeof value === "number" ? value : value[0];
      isDraggingRef.current = false;
      const player = getPlayerRef();
      if (player && currentSong) {
        player.seekTo(currentSong.startSeconds + v, true);
      }
    },
    [currentSong]
  );

  if (!currentSong) return null;

  return (
    <Box sx={{ px: 1 }}>
      <Slider
        value={position}
        min={0}
        max={duration}
        step={1}
        onChange={handleChange}
        onChangeCommitted={handleChangeCommitted}
        size="small"
        sx={{
          "& .MuiSlider-thumb": { width: 12, height: 12 },
          "& .MuiSlider-rail": { opacity: 0.3 },
        }}
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: -1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {formatTime(position)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatTime(duration)}
        </Typography>
      </Box>
    </Box>
  );
}
