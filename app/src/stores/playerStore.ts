import { create } from "zustand";
import type { YouTubePlayer } from "react-youtube";
import type { SongPerformance } from "../data/types";
import { useHistoryStore } from "./historyStore";

/* ---- module-scope player ref (mutable, outside zustand) ---- */
let _playerRef: YouTubePlayer | null = null;

export function getPlayerRef(): YouTubePlayer | null {
  return _playerRef;
}

export function setPlayerRef(player: YouTubePlayer | null): void {
  _playerRef = player;
}

interface PlayerState {
  queue: SongPerformance[];
  currentIndex: number;
  isPlaying: boolean;
  isShuffle: boolean;
  isRepeat: boolean;

  /** 曲を再生。queueが渡されればキュー全体をセット */
  playSong: (song: SongPerformance, queue?: SongPerformance[]) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  setIsPlaying: (v: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  isShuffle: false,
  isRepeat: false,

  playSong: (song, queue) => {
    useHistoryStore.getState().addToHistory(song.performanceId);
    if (queue) {
      const idx = queue.findIndex(
        (s) => s.performanceId === song.performanceId
      );
      set({ queue, currentIndex: idx >= 0 ? idx : 0, isPlaying: true });
    } else {
      set({ queue: [song], currentIndex: 0, isPlaying: true });
    }
  },

  playNext: () => {
    const { queue, currentIndex, isShuffle, isRepeat } = get();
    if (queue.length === 0) return;

    let nextIndex: number;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (currentIndex + 1 < queue.length) {
      nextIndex = currentIndex + 1;
    } else if (isRepeat) {
      nextIndex = 0;
    } else {
      set({ isPlaying: false });
      return;
    }
    set({ currentIndex: nextIndex, isPlaying: true });
  },

  playPrev: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    set({ currentIndex: prevIndex, isPlaying: true });
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setIsPlaying: (v) => set({ isPlaying: v }),
  toggleShuffle: () => set((s) => ({ isShuffle: !s.isShuffle })),
  toggleRepeat: () => set((s) => ({ isRepeat: !s.isRepeat })),
}));

/** 現在再生中の曲を取得するセレクタ */
export const useCurrentSong = () =>
  usePlayerStore(
    (s) => (s.currentIndex >= 0 ? s.queue[s.currentIndex] : undefined),
    Object.is
  );
