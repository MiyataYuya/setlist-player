import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import SongCard from "./SongCard";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import type { SongPerformance } from "../../data/types";

interface Props {
  songs: SongPerformance[];
}

export default function SongList({ songs }: Props) {
  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll(songs);

  if (songs.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">曲が見つかりません</Typography>
      </Box>
    );
  }

  return (
    <>
      <List disablePadding>
        {visibleItems.map((song) => (
          <SongCard key={song.performanceId} song={song} queue={songs} />
        ))}
      </List>
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
    </>
  );
}
