import List from "@mui/material/List";
import StreamCard from "./StreamCard";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import type { Stream } from "../../data/types";

interface Props {
  streams: Stream[];
}

export default function StreamList({ streams }: Props) {
  const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll(streams);

  return (
    <>
      <List disablePadding>
        {visibleItems.map((stream) => (
          <StreamCard key={stream.videoId} stream={stream} />
        ))}
      </List>
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
    </>
  );
}
