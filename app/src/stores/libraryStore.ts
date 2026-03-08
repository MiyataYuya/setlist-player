import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LibraryState {
  favoriteIds: string[]; // performanceIdの配列
  searchQuery: string;

  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  setSearchQuery: (q: string) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      searchQuery: "",

      toggleFavorite: (id) =>
        set((s) => {
          const exists = s.favoriteIds.includes(id);
          return {
            favoriteIds: exists
              ? s.favoriteIds.filter((fid) => fid !== id)
              : [...s.favoriteIds, id],
          };
        }),

      isFavorite: (id) => get().favoriteIds.includes(id),

      setSearchQuery: (q) => set({ searchQuery: q }),
    }),
    {
      name: "karaoke-library",
      partialize: (s) => ({ favoriteIds: s.favoriteIds }),
    }
  )
);
