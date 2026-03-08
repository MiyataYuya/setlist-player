import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import LabelIcon from "@mui/icons-material/Label";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import PlayerControls from "./PlayerControls";
import SeekBar from "./SeekBar";
import FavoriteButton from "../common/FavoriteButton";
import TagManager from "../songs/TagManager";
import { usePlayerStore, useCurrentSong } from "../../stores/playerStore";
import { useNavigate } from "react-router-dom";

export default function PlayerScreen() {
  const currentSong = useCurrentSong();
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const playSong = usePlayerStore((s) => s.playSong);
  const navigate = useNavigate();
  const [tagManagerOpen, setTagManagerOpen] = useState(false);

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

  const upcomingQueue = queue.slice(currentIndex + 1);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100dvh - 56.25vw - 56px)",
        minHeight: 280,
      }}
    >
      {/* グリップハンドル — タップでホームに戻る */}
      <Box
        onClick={() => navigate("/")}
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 0.75,
          cursor: "pointer",
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 4,
            borderRadius: 2,
            bgcolor: "grey.600",
          }}
        />
      </Box>

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

      {/* キュー（次の曲） */}
      {upcomingQueue.length > 0 && (
        <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", mt: 1 }}>
          <Box sx={{ px: 3, display: "flex", alignItems: "center", gap: 0.5 }}>
            <QueueMusicIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              次に再生 ({upcomingQueue.length})
            </Typography>
          </Box>
          <List
            dense
            disablePadding
            sx={{
              flex: 1,
              overflowY: "auto",
              px: 1,
              "&::-webkit-scrollbar": { width: 0 },
            }}
          >
            {upcomingQueue.map((song, i) => (
              <ListItemButton
                key={song.performanceId}
                onClick={() => playSong(song, queue)}
                sx={{
                  borderRadius: 1,
                  py: 0.5,
                  px: 2,
                  minHeight: 0,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
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
                  }}
                  secondaryTypographyProps={{
                    variant: "caption",
                    noWrap: true,
                  }}
                  sx={{ my: 0 }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}
