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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* YouTubeEmbed は App.tsx で常時マウント */}

      {/* 曲情報 — 動画の下に余白を持たせて配置 */}
      <Box sx={{ px: 3, pt: 4, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            mb: 1,
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
          <FavoriteButton performanceId={currentSong.performanceId} />
        </Box>

        {/* コントロール — 曲情報の下に余白を持たせて配置 */}
        <Box sx={{ mt: 4 }}>
          <PlayerControls />
        </Box>
      </Box>
    </Box>
  );
}
