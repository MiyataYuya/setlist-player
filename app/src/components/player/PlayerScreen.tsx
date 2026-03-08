import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PlayerControls from "./PlayerControls";
import FavoriteButton from "../common/FavoriteButton";
import { useCurrentSong } from "../../stores/playerStore";

export default function PlayerScreen() {
  const currentSong = useCurrentSong();

  if (!currentSong) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
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
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* YouTubeEmbed は App.tsx で常時マウント */}

      <Box sx={{ p: 2, flex: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" noWrap>
              {currentSong.title}
            </Typography>
            {currentSong.artist && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {currentSong.artist}
              </Typography>
            )}
            {date && (
              <Typography variant="caption" color="text.secondary">
                {date}
              </Typography>
            )}
          </Box>
          <FavoriteButton performanceId={currentSong.performanceId} />
        </Box>

        <PlayerControls />
      </Box>
    </Box>
  );
}
