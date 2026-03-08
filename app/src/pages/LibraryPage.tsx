import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SongList from "../components/songs/SongList";
import { useLibraryStore } from "../stores/libraryStore";
import { songPerformances } from "../data/songs";

export default function LibraryPage() {
  const favoriteIds = useLibraryStore((s) => s.favoriteIds);
  const favorites = songPerformances.filter((s) =>
    favoriteIds.includes(s.performanceId)
  );

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          ライブラリ
        </Typography>
        <Typography variant="body2" color="text.secondary">
          お気に入り: {favorites.length} 曲
        </Typography>
      </Box>
      {favorites.length === 0 ? (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            お気に入りに追加された曲がありません
          </Typography>
        </Box>
      ) : (
        <SongList songs={favorites} />
      )}
    </Box>
  );
}
