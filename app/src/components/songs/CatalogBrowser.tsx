import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import { PILL_BUTTON_SX } from "../common/pillButtonSx";
import { useCatalog } from "../../stores/catalogStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useTagStore } from "../../stores/tagStore";
import SongList from "./SongList";
import SortMenu from "./SortMenu";
import StreamList from "./StreamList";
import TagFilter from "./TagFilter";
import type { SortOption } from "./SortMenu";

type BrowseMode = "stream" | "song";

/**
 * 全曲・全配信の一覧。曲/配信の切替、並び替え、タグ絞り込み、全曲シャッフルを持つ。
 * 表示方法（リスト/タイル/グリッド）の切替はページ上部に置くのでここには含めない。
 */
export default function CatalogBrowser() {
  const { songPerformances, streams } = useCatalog();
  const playSong = usePlayerStore((s) => s.playSong);
  const shuffleQueue = usePlayerStore((s) => s.shuffleQueue);
  const [browseMode, setBrowseMode] = useState<BrowseMode>("song");
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const sortedSongs = useMemo(() => {
    let songs = [...songPerformances];

    if (selectedTags.length > 0) {
      const songTags = useTagStore.getState().songTags;
      songs = songs.filter((song) => {
        const tags = songTags[song.performanceId] ?? [];
        return selectedTags.every((tag) => tags.includes(tag));
      });
    }

    return songs.sort((a, b) => {
      switch (sortOption) {
        case "date-desc":
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        case "date-asc":
          return (
            new Date(a.publishedAt).getTime() -
            new Date(b.publishedAt).getTime()
          );
        case "title-asc":
          return a.title.localeCompare(b.title, "ja");
        case "title-desc":
          return b.title.localeCompare(a.title, "ja");
        case "artist-asc":
          return a.artist.localeCompare(b.artist, "ja");
        case "artist-desc":
          return b.artist.localeCompare(a.artist, "ja");
      }
    });
  }, [songPerformances, sortOption, selectedTags]);

  function handleToggleTag(tag: string): void {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  const handleShuffleAll = () => {
    const random = Math.floor(Math.random() * songPerformances.length);
    playSong(songPerformances[random], songPerformances);
    shuffleQueue();
  };

  return (
    <>
      {/* コントロール類は中央カラム全幅に伸ばすと間延びするので幅を抑える */}
      <Box sx={{ px: 2, pb: 2, maxWidth: 560 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {browseMode === "song"
            ? `${songPerformances.length} 曲`
            : `${streams.length} 配信`}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              label="曲"
              variant={browseMode === "song" ? "filled" : "outlined"}
              onClick={() => setBrowseMode("song")}
            />
            <Chip
              label="配信"
              variant={browseMode === "stream" ? "filled" : "outlined"}
              onClick={() => setBrowseMode("stream")}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              startIcon={<ShuffleIcon fontSize="small" />}
              onClick={handleShuffleAll}
              sx={{ ...PILL_BUTTON_SX, flexShrink: 0 }}
            >
              シャッフル再生
            </Button>
            {browseMode === "song" && (
              <SortMenu value={sortOption} onChange={setSortOption} />
            )}
          </Box>
        </Box>
        {browseMode === "song" && (
          <TagFilter selectedTags={selectedTags} onToggle={handleToggleTag} />
        )}
      </Box>
      {browseMode === "song" ? (
        <SongList songs={sortedSongs} />
      ) : (
        <StreamList streams={streams} />
      )}
    </>
  );
}
