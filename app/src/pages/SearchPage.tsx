import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";
import SearchBar from "../components/songs/SearchBar";
import SongList from "../components/songs/SongList";
import { useFilteredSongs } from "../hooks/useFilteredSongs";
import { useRecentSongs } from "../hooks/useRecentSongs";
import { useLibraryStore } from "../stores/libraryStore";

export default function SearchPage() {
  const songs = useFilteredSongs();
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const recentSongs = useRecentSongs();
  const isSearching = searchQuery.trim().length > 0;

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          検索
        </Typography>
        <SearchBar />
        {isSearching && (
          <Typography variant="body2" color="text.secondary">
            {songs.length} 件
          </Typography>
        )}
      </Box>
      {isSearching ? (
        <SongList songs={songs} />
      ) : (
        <>
          <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
            <SearchIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography color="text.secondary">曲名やアーティスト名で検索</Typography>
          </Box>
          {recentSongs.length > 0 && (
            <>
              <Box sx={{ px: 2, mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  最近再生した曲
                </Typography>
              </Box>
              <SongList songs={recentSongs} />
            </>
          )}
        </>
      )}
    </Box>
  );
}
