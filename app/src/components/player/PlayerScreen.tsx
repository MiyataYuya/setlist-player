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
          height: "calc(100vh - 120px)",
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
        /* 動画の16:9 + 曲情報 + コントロールをビューポート内に収める */
        /* BottomNavが約56px + MiniPlayerが非表示(player画面では) */
        height: "calc(100vh - 56px)",
      }}
    >
      {/* YouTubeEmbed は App.tsx で常時マウント — ここでは残りスペースを使う */}

      {/* 曲情報 */}
      <Box sx={{ px: 3, pt: 3 }}>
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
          <FavoriteButton performanceId={currentSong.performanceId} />
        </Box>
      </Box>

      {/* コントロール — 残りスペースの中央に配置 */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PlayerControls />
      </Box>
    </Box>
  );
}
