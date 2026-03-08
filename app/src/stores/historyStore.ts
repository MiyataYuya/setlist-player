import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HistoryEntry {
  performanceId: string;
  playedAt: string;
}

const MAX_HISTORY = 200;

interface HistoryState {
  history: HistoryEntry[];
  addToHistory: (performanceId: string) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      history: [],

      addToHistory: (performanceId) =>
        set((s) => ({
          history: [
            { performanceId, playedAt: new Date().toISOString() },
            ...s.history,
          ].slice(0, MAX_HISTORY),
        })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "karaoke-history",
      partialize: (s) => ({ history: s.history }),
    }
  )
);
