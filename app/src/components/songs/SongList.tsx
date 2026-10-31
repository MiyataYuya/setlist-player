import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import SongCard from "./SongCard";
import { songCardVariant, songGridSx } from "./cardGrid";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { useSongViewMode } from "../../hooks/useSongViewMode";
import type { SongPerformance } from "../../data/types";

interface Props {
  songs: SongPerformance[];
  /** 配信カードの中など、入れ子で出すとき */
  nested?: boolean;
}

export default function SongList({ songs, nested }: Props) {
  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll(songs);
  const mode = useSongViewMode();

  if (songs.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">曲が見つかりません</Typography>
      </Box>
    );
  }

  // 入れ子では全件出す（配信1本ぶんなので打ち切る必要がない）
  const items = nested ? songs : visibleItems;
  const variant = songCardVariant(mode);

  return (
    <>
      <Box
        data-testid="song-list"
        role="list"
        sx={{
          ...songGridSx(mode),
          px: 2,
          ...(nested && { pl: 4, py: 1, bgcolor: "action.hover" }),
        }}
      >
        {items.map((song) => (
          <SongCard
            key={song.performanceId}
            song={song}
            queue={songs}
            variant={variant}
          />
        ))}
      </Box>
      {!nested && hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
    </>
  );
}
