import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlayerStore, useCurrentSong } from "../playerStore";
import type { SongPerformance } from "../../data/types";

function makeSong(id: string): SongPerformance {
  return {
    performanceId: id,
    songId: `song-${id}`,
    title: `Title ${id}`,
    artist: `Artist ${id}`,
    videoId: `video-${id}`,
    startSeconds: 0,
    endSeconds: 300,
    publishedAt: "2024-01-01T00:00:00Z",
    thumbnailUrl: `https://img.youtube.com/vi/video-${id}/mqdefault.jpg`,
  };
}

const songA = makeSong("a");
const songB = makeSong("b");
const songC = makeSong("c");
const queue = [songA, songB, songC];

describe("playerStore", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      queue: [],
      currentIndex: -1,
      isPlaying: false,
      isShuffle: false,
      isRepeat: false,
    });
  });

  // #1 playSong with queue
  it("playSong(song, queue) sets queue/currentIndex/isPlaying correctly", () => {
    act(() => usePlayerStore.getState().playSong(songB, queue));
    const s = usePlayerStore.getState();
    expect(s.queue).toBe(queue);
    expect(s.currentIndex).toBe(1);
    expect(s.isPlaying).toBe(true);
  });

  // #2 playSong without queue
  it("playSong(song) without queue creates single-item queue", () => {
    act(() => usePlayerStore.getState().playSong(songA));
    const s = usePlayerStore.getState();
    expect(s.queue).toEqual([songA]);
    expect(s.currentIndex).toBe(0);
    expect(s.isPlaying).toBe(true);
  });

  // #3 playNext normal
  it("playNext() increments currentIndex", () => {
    usePlayerStore.setState({ queue, currentIndex: 0, isPlaying: true });
    act(() => usePlayerStore.getState().playNext());
    expect(usePlayerStore.getState().currentIndex).toBe(1);
  });

  // #4 playNext at end, repeat=false
  it("playNext() at end with repeat=false stops playing", () => {
    usePlayerStore.setState({ queue, currentIndex: 2, isPlaying: true, isRepeat: false });
    act(() => usePlayerStore.getState().playNext());
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  // #5 playNext at end, repeat=true
  it("playNext() at end with repeat=true wraps to 0", () => {
    usePlayerStore.setState({ queue, currentIndex: 2, isPlaying: true, isRepeat: true });
    act(() => usePlayerStore.getState().playNext());
    expect(usePlayerStore.getState().currentIndex).toBe(0);
  });

  // #6 playNext shuffle
  it("playNext() with shuffle=true picks random index", () => {
    usePlayerStore.setState({ queue, currentIndex: 0, isPlaying: true, isShuffle: true });
    act(() => usePlayerStore.getState().playNext());
    const idx = usePlayerStore.getState().currentIndex;
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(queue.length);
  });

  // #7 playNext empty queue
  it("playNext() with empty queue does nothing", () => {
    usePlayerStore.setState({ queue: [], currentIndex: -1, isPlaying: false });
    act(() => usePlayerStore.getState().playNext());
    expect(usePlayerStore.getState().currentIndex).toBe(-1);
  });

  // #8 playPrev normal
  it("playPrev() decrements currentIndex", () => {
    usePlayerStore.setState({ queue, currentIndex: 2, isPlaying: true });
    act(() => usePlayerStore.getState().playPrev());
    expect(usePlayerStore.getState().currentIndex).toBe(1);
  });

  // #9 playPrev at start
  it("playPrev() at start wraps to end", () => {
    usePlayerStore.setState({ queue, currentIndex: 0, isPlaying: true });
    act(() => usePlayerStore.getState().playPrev());
    expect(usePlayerStore.getState().currentIndex).toBe(2);
  });

  // #10 togglePlay
  it("togglePlay() flips isPlaying", () => {
    usePlayerStore.setState({ isPlaying: false });
    act(() => usePlayerStore.getState().togglePlay());
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    act(() => usePlayerStore.getState().togglePlay());
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  // #11 toggleShuffle
  it("toggleShuffle() flips isShuffle", () => {
    expect(usePlayerStore.getState().isShuffle).toBe(false);
    act(() => usePlayerStore.getState().toggleShuffle());
    expect(usePlayerStore.getState().isShuffle).toBe(true);
  });

  // #12 toggleRepeat
  it("toggleRepeat() flips isRepeat", () => {
    expect(usePlayerStore.getState().isRepeat).toBe(false);
    act(() => usePlayerStore.getState().toggleRepeat());
    expect(usePlayerStore.getState().isRepeat).toBe(true);
  });

  // #13 useCurrentSong
  it("useCurrentSong returns song when currentIndex >= 0", () => {
    usePlayerStore.setState({ queue, currentIndex: 1 });
    const { result } = renderHook(() => useCurrentSong());
    expect(result.current).toBe(songB);
  });

  it("useCurrentSong returns undefined when currentIndex = -1", () => {
    usePlayerStore.setState({ queue, currentIndex: -1 });
    const { result } = renderHook(() => useCurrentSong());
    expect(result.current).toBeUndefined();
  });
});
