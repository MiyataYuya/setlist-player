import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SearchBar from "../components/songs/SearchBar";
import SongList from "../components/songs/SongList";
import { useFilteredSongs } from "../hooks/useFilteredSongs";
import { useLibraryStore } from "../stores/libraryStore";

export default function SearchPage() {
  const songs = useFilteredSongs();
  const searchQuery = useLibraryStore((s) => s.searchQuery);

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          検索
        </Typography>
        <SearchBar />
        {searchQuery && (
          <Typography variant="body2" color="text.secondary">
            {songs.length} 件
          </Typography>
        )}
      </Box>
      <SongList songs={searchQuery ? songs : []} />
    </Box>
  );
}
