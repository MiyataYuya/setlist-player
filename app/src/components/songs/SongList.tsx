import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import SongCard from "./SongCard";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import type { SongPerformance } from "../../data/types";

interface Props {
  songs: SongPerformance[];
  nested?: boolean;
}

export default function SongList({ songs, nested }: Props) {
  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll(songs);

  if (songs.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">曲が見つかりません</Typography>
      </Box>
    );
  }

  const items = nested ? songs : visibleItems;

  return (
    <>
      <List disablePadding sx={nested ? { pl: 2, bgcolor: "action.hover" } : undefined}>
        {items.map((song) => (
          <SongCard key={song.performanceId} song={song} queue={songs} />
        ))}
      </List>
      {!nested && hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
    </>
  );
}
