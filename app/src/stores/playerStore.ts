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

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface PlayerState {
  queue: SongPerformance[];
  /** シャッフル前の元キュー（シャッフルOFF時に復元用） */
  originalQueue: SongPerformance[];
  currentIndex: number;
  isPlaying: boolean;
  isShuffle: boolean;
  isRepeat: boolean;

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
  originalQueue: [],
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
      set({
        queue,
        originalQueue: queue,
        currentIndex: idx >= 0 ? idx : 0,
        isPlaying: true,
      });
    } else {
      set({
        queue: [song],
        originalQueue: [song],
        currentIndex: 0,
        isPlaying: true,
      });
    }
  },

  playNext: () => {
    const { queue, currentIndex, isRepeat } = get();
    if (queue.length === 0) return;

    if (currentIndex + 1 < queue.length) {
      set({ currentIndex: currentIndex + 1, isPlaying: true });
    } else if (isRepeat) {
      set({ currentIndex: 0, isPlaying: true });
    } else {
      set({ isPlaying: false });
    }
  },

  playPrev: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    set({ currentIndex: prevIndex, isPlaying: true });
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setIsPlaying: (v) => set({ isPlaying: v }),

  toggleShuffle: () => {
    const { isShuffle, queue, originalQueue, currentIndex } = get();
    const currentSong = currentIndex >= 0 ? queue[currentIndex] : null;

    if (!isShuffle) {
      // シャッフルON: 現在の曲を先頭に、残りをシャッフル
      if (currentSong) {
        const rest = queue.filter(
          (s) => s.performanceId !== currentSong.performanceId
        );
        const shuffled = [currentSong, ...shuffleArray(rest)];
        set({ isShuffle: true, queue: shuffled, currentIndex: 0 });
      } else {
        set({ isShuffle: true, queue: shuffleArray(queue), currentIndex: 0 });
      }
    } else {
      // シャッフルOFF: 元の順序に戻す
      if (currentSong) {
        const idx = originalQueue.findIndex(
          (s) => s.performanceId === currentSong.performanceId
        );
        set({
          isShuffle: false,
          queue: originalQueue,
          currentIndex: idx >= 0 ? idx : 0,
        });
      } else {
        set({ isShuffle: false, queue: originalQueue, currentIndex: 0 });
      }
    }
  },

  toggleRepeat: () => set((s) => ({ isRepeat: !s.isRepeat })),
}));

/** 現在再生中の曲を取得するセレクタ */
export const useCurrentSong = () =>
  usePlayerStore(
    (s): SongPerformance | undefined =>
      s.currentIndex >= 0 ? s.queue[s.currentIndex] : undefined,
  );
