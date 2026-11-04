import { useMemo } from "react";
import { useCatalog } from "../stores/catalogStore";
import { useLibraryStore } from "../stores/libraryStore";
import type { SongPerformance } from "../data/types";

export function useFilteredSongs(): SongPerformance[] {
  const { songPerformances } = useCatalog();
  const searchQuery = useLibraryStore((s) => s.searchQuery);

  return useMemo(() => {
    if (!searchQuery.trim()) return songPerformances;

    const q = searchQuery.toLowerCase();
    return songPerformances.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q)
    );
  }, [songPerformances, searchQuery]);
}
