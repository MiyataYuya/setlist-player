import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TagState {
  tags: string[];
  songTags: Record<string, string[]>;

  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  assignTag: (performanceId: string, tag: string) => void;
  unassignTag: (performanceId: string, tag: string) => void;
}

export const useTagStore = create<TagState>()(
  persist(
    (set) => ({
      tags: [],
      songTags: {},

      addTag: (tag) =>
        set((s) => {
          if (s.tags.includes(tag)) return s;
          return { tags: [...s.tags, tag] };
        }),

      removeTag: (tag) =>
        set((s) => {
          const songTags: Record<string, string[]> = {};
          for (const [id, tags] of Object.entries(s.songTags)) {
            const filtered = tags.filter((t) => t !== tag);
            if (filtered.length > 0) {
              songTags[id] = filtered;
            }
          }
          return {
            tags: s.tags.filter((t) => t !== tag),
            songTags,
          };
        }),

      assignTag: (performanceId, tag) =>
        set((s) => {
          const current = s.songTags[performanceId] ?? [];
          if (current.includes(tag)) return s;
          return {
            songTags: { ...s.songTags, [performanceId]: [...current, tag] },
          };
        }),

      unassignTag: (performanceId, tag) =>
        set((s) => {
          const current = s.songTags[performanceId] ?? [];
          const filtered = current.filter((t) => t !== tag);
          const songTags = { ...s.songTags };
          if (filtered.length === 0) {
            delete songTags[performanceId];
          } else {
            songTags[performanceId] = filtered;
          }
          return { songTags };
        }),
    }),
    {
      name: "karaoke-tags",
      partialize: (s) => ({ tags: s.tags, songTags: s.songTags }),
    }
  )
);
