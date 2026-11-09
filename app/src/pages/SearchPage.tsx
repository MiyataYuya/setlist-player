import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PageHeader from "../components/common/PageHeader";
import SearchBar from "../components/songs/SearchBar";
import SongList from "../components/songs/SongList";
import CatalogBrowser from "../components/songs/CatalogBrowser";
import ViewModeToggle from "../components/songs/ViewModeToggle";
import { useFilteredSongs } from "../hooks/useFilteredSongs";
import { useLibraryStore } from "../stores/libraryStore";

export default function SearchPage() {
  const songs = useFilteredSongs();
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const isSearching = searchQuery.trim().length > 0;

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ p: 2 }}>
        <PageHeader title="検索" action={<ViewModeToggle />} />
        <SearchBar />
        {isSearching && (
          <Typography variant="body2" color="text.secondary">
            {songs.length} 件
          </Typography>
        )}
      </Box>
      {/* 未入力のときは全曲を一覧する（検索語で絞り込む前の状態） */}
      {isSearching ? <SongList songs={songs} /> : <CatalogBrowser />}
    </Box>
  );
}
