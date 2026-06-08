import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MIN_PLAYER_PANE_WIDTH = 320;
export const MAX_PLAYER_PANE_WIDTH = 640;
const DEFAULT_PLAYER_PANE_WIDTH = 360;

function clampWidth(px: number): number {
  return Math.round(
    Math.min(MAX_PLAYER_PANE_WIDTH, Math.max(MIN_PLAYER_PANE_WIDTH, px))
  );
}

interface LayoutState {
  playerPaneWidth: number;
  setPlayerPaneWidth: (px: number) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      playerPaneWidth: DEFAULT_PLAYER_PANE_WIDTH,
      setPlayerPaneWidth: (px) => set({ playerPaneWidth: clampWidth(px) }),
    }),
    {
      name: "karaoke-layout",
      partialize: (s) => ({ playerPaneWidth: s.playerPaneWidth }),
    }
  )
);
