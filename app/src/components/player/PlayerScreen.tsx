import { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import LabelIcon from "@mui/icons-material/Label";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import PlayerControls from "./PlayerControls";
import SeekBar from "./SeekBar";
import FavoriteButton from "../common/FavoriteButton";
import TagManager from "../songs/TagManager";
import { usePlayerStore, useCurrentSong } from "../../stores/playerStore";

export default function PlayerScreen() {
  const currentSong = useCurrentSong();
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const playSong = usePlayerStore((s) => s.playSong);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const currentItemRef = useRef<HTMLDivElement>(null);

  // 現在の曲が変わったらキュー内の現在曲位置にスクロール
  useEffect(() => {
    currentItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [currentIndex]);

  if (!currentSong) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
        }}
      >
        <Typography color="text.secondary">
          曲を選択してください
        </Typography>
      </Box>
    );
  }

  const date = currentSong.publishedAt
    ? new Date(currentSong.publishedAt).toLocaleDateString("ja-JP")
    : "";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overscrollBehavior: "none",
      }}
    >
      {/* 閉じるボタン */}
      <IconButton
        onClick={() => window.history.back()}
        sx={{ alignSelf: "flex-start", ml: 1, mt: 0.5 }}
      >
        <KeyboardArrowDownIcon />
      </IconButton>

      {/* 曲情報 */}
      <Box sx={{ px: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" fontWeight="bold" noWrap lineHeight={1.3}>
              {currentSong.title}
            </Typography>
            {currentSong.artist && (
              <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
                {currentSong.artist}
              </Typography>
            )}
            {date && (
              <Typography variant="caption" color="text.secondary">
                {date}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
            <FavoriteButton performanceId={currentSong.performanceId} />
            <IconButton size="small" onClick={() => setTagManagerOpen(true)}>
              <LabelIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <TagManager
          open={tagManagerOpen}
          onClose={() => setTagManagerOpen(false)}
          performanceId={currentSong.performanceId}
        />
      </Box>

      {/* シークバー + コントロール */}
      <Box sx={{ px: 3, pt: 1 }}>
        <SeekBar />
        <Box sx={{ mt: 0.5 }}>
          <PlayerControls />
        </Box>
      </Box>

      {/* キュー */}
      {queue.length > 0 && (
        <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", mt: 1 }}>
          <Box sx={{ px: 3, display: "flex", alignItems: "center", gap: 0.5 }}>
            <QueueMusicIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              キュー ({queue.length})
            </Typography>
          </Box>
          <List
            dense
            disablePadding
            sx={{
              flex: 1,
              overflowY: "auto",
              overscrollBehavior: "contain",
              px: 1,
              "&::-webkit-scrollbar": { width: 0 },
            }}
          >
            {queue.map((song, i) => {
              const isCurrent = i === currentIndex;
              const isPlayed = i < currentIndex;
              return (
                <ListItemButton
                  key={`${song.performanceId}-${i}`}
                  ref={isCurrent ? currentItemRef : undefined}
                  onClick={() => playSong(song, queue)}
                  sx={{
                    borderRadius: 1,
                    py: 0.5,
                    px: 2,
                    minHeight: 0,
                    opacity: isPlayed ? 0.45 : 1,
                    bgcolor: isCurrent ? "action.selected" : "transparent",
                  }}
                >
                  <Typography
                    variant="caption"
                    color={isCurrent ? "primary" : "text.secondary"}
                    sx={{ width: 20, flexShrink: 0 }}
                  >
                    {i + 1}
                  </Typography>
                  <ListItemText
                    primary={song.title}
                    secondary={song.artist}
                    primaryTypographyProps={{
                      variant: "body2",
                      noWrap: true,
                      lineHeight: 1.3,
                      color: isCurrent ? "primary" : "text.primary",
                      fontWeight: isCurrent ? 700 : 400,
                    }}
                    secondaryTypographyProps={{
                      variant: "caption",
                      noWrap: true,
                    }}
                    sx={{ my: 0 }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      )}
    </Box>
  );
}
