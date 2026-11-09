import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PageHeader from "../components/common/PageHeader";
import SearchBar from "../components/songs/SearchBar";
import SongList from "../components/songs/SongList";
import CatalogBrowser from "../components/songs/CatalogBrowser";
import StyleFilter from "../components/songs/StyleFilter";
import ViewModeToggle from "../components/songs/ViewModeToggle";
import { useFilteredSongs } from "../hooks/useFilteredSongs";
import { useLibraryStore } from "../stores/libraryStore";
import type { PerformanceStyle } from "../data/types";

export default function SearchPage() {
  const songs = useFilteredSongs();
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const isSearching = searchQuery.trim().length > 0;
  // 検索結果と全曲一覧で共有する（入力の有無を切り替えても選択が残るように）
  const [style, setStyle] = useState<PerformanceStyle | null>(null);

  const styledResults = useMemo(
    () => (style === null ? songs : songs.filter((song) => song.style === style)),
    [songs, style]
  );

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ p: 2 }}>
        <PageHeader title="検索" action={<ViewModeToggle />} />
        <SearchBar />
        <StyleFilter value={style} onChange={setStyle} />
        {isSearching && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {styledResults.length} 件
          </Typography>
        )}
      </Box>
      {/* 未入力のときは全曲を一覧する（検索語で絞り込む前の状態） */}
      {isSearching ? (
        <SongList songs={styledResults} />
      ) : (
        <CatalogBrowser style={style} />
      )}
    </Box>
  );
}
