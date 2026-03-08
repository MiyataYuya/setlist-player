import { useMemo } from "react";
import { songPerformances } from "../data/songs";
import { useLibraryStore } from "../stores/libraryStore";
import type { SongPerformance } from "../data/types";

export function useFilteredSongs(): SongPerformance[] {
  const searchQuery = useLibraryStore((s) => s.searchQuery);

  return useMemo(() => {
    if (!searchQuery.trim()) return songPerformances;

    const q = searchQuery.toLowerCase();
    return songPerformances.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q)
    );
  }, [searchQuery]);
}
