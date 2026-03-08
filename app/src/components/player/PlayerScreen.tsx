import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import LabelIcon from "@mui/icons-material/Label";
import PlayerControls from "./PlayerControls";
import SeekBar from "./SeekBar";
import FavoriteButton from "../common/FavoriteButton";
import TagManager from "../songs/TagManager";
import { useCurrentSong } from "../../stores/playerStore";

export default function PlayerScreen() {
  const currentSong = useCurrentSong();
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

  return (
    <>
      {/* 曲情報 */}
      <Box sx={{ px: 3, pt: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h5" fontWeight="bold" noWrap>
              {currentSong.title}
            </Typography>
            {currentSong.artist && (
              <Typography variant="body1" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                {currentSong.artist}
              </Typography>
            )}
            {date && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {date}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FavoriteButton performanceId={currentSong.performanceId} />
            <IconButton onClick={() => setTagManagerOpen(true)}>
              <LabelIcon />
            </IconButton>
          </Box>
        </Box>
        <TagManager
          open={tagManagerOpen}
          onClose={() => setTagManagerOpen(false)}
          performanceId={currentSong.performanceId}
        />
      </Box>

      {/* シークバー */}
      <Box sx={{ px: 3, pt: 2 }}>
        <SeekBar />
      </Box>

      {/* コントロール */}
      <Box sx={{ px: 3, pt: 1 }}>
        <PlayerControls />
      </Box>
    </>
  );
}
