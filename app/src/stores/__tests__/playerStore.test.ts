import { describe, it, expect, beforeEach } from "vitest";
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
const songD = makeSong("d");
const songE = makeSong("e");
const queue = [songA, songB, songC, songD, songE];

describe("playerStore", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      queue: [],
      currentIndex: -1,
      isPlaying: false,
      isRepeat: false,
      isPlayerOpen: false,
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
    usePlayerStore.setState({ queue, currentIndex: 4, isPlaying: true, isRepeat: false });
    act(() => usePlayerStore.getState().playNext());
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  // #5 playNext at end, repeat=true
  it("playNext() at end with repeat=true wraps to 0", () => {
    usePlayerStore.setState({ queue, currentIndex: 4, isPlaying: true, isRepeat: true });
    act(() => usePlayerStore.getState().playNext());
    expect(usePlayerStore.getState().currentIndex).toBe(0);
  });

  // #6 playNext empty queue
  it("playNext() with empty queue does nothing", () => {
    usePlayerStore.setState({ queue: [], currentIndex: -1, isPlaying: false });
    act(() => usePlayerStore.getState().playNext());
    expect(usePlayerStore.getState().currentIndex).toBe(-1);
  });

  // #7 playPrev normal
  it("playPrev() decrements currentIndex", () => {
    usePlayerStore.setState({ queue, currentIndex: 2, isPlaying: true });
    act(() => usePlayerStore.getState().playPrev());
    expect(usePlayerStore.getState().currentIndex).toBe(1);
  });

  // #8 playPrev at start
  it("playPrev() at start wraps to end", () => {
    usePlayerStore.setState({ queue, currentIndex: 0, isPlaying: true });
    act(() => usePlayerStore.getState().playPrev());
    expect(usePlayerStore.getState().currentIndex).toBe(4);
  });

  // #9 togglePlay
  it("togglePlay() flips isPlaying", () => {
    usePlayerStore.setState({ isPlaying: false });
    act(() => usePlayerStore.getState().togglePlay());
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    act(() => usePlayerStore.getState().togglePlay());
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  // #10 toggleRepeat
  it("toggleRepeat() flips isRepeat", () => {
    expect(usePlayerStore.getState().isRepeat).toBe(false);
    act(() => usePlayerStore.getState().toggleRepeat());
    expect(usePlayerStore.getState().isRepeat).toBe(true);
    act(() => usePlayerStore.getState().toggleRepeat());
    expect(usePlayerStore.getState().isRepeat).toBe(false);
  });

  // #11 useCurrentSong
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

  // --- シャッフル ---

  // #12 shuffleQueue: キューがシャッフルされ、現在の曲が先頭に来る
  it("shuffleQueue shuffles queue with current song at index 0", () => {
    usePlayerStore.setState({ queue: [...queue], currentIndex: 2 });
    act(() => usePlayerStore.getState().shuffleQueue());
    const s = usePlayerStore.getState();
    expect(s.currentIndex).toBe(0);
    // 現在の曲（songC）が先頭
    expect(s.queue[0].performanceId).toBe("c");
    // キューの長さは変わらない
    expect(s.queue.length).toBe(queue.length);
    // 全曲が含まれている
    const ids = s.queue.map((q) => q.performanceId).sort();
    expect(ids).toEqual(["a", "b", "c", "d", "e"]);
  });

  // #13 shuffleQueue: 連続で押すと毎回シャッフルされる
  it("shuffleQueue can be called multiple times", () => {
    usePlayerStore.setState({ queue: [...queue], currentIndex: 0 });
    act(() => usePlayerStore.getState().shuffleQueue());
    const first = usePlayerStore.getState().queue.map((q) => q.performanceId);
    expect(first[0]).toBe("a"); // 現在の曲が先頭
    expect(first.length).toBe(5);

    act(() => usePlayerStore.getState().shuffleQueue());
    const second = usePlayerStore.getState().queue.map((q) => q.performanceId);
    expect(second[0]).toBe("a"); // 現在の曲が先頭
    expect(second.length).toBe(5);
  });

  // #14 shuffleQueue: 空キューでは何もしない
  it("shuffleQueue with empty queue does nothing", () => {
    usePlayerStore.setState({ queue: [], currentIndex: -1 });
    act(() => usePlayerStore.getState().shuffleQueue());
    expect(usePlayerStore.getState().queue).toEqual([]);
    expect(usePlayerStore.getState().currentIndex).toBe(-1);
  });

  // #15 shuffleQueue: 1曲のみのキュー
  it("shuffleQueue with single song keeps it", () => {
    usePlayerStore.setState({ queue: [songA], currentIndex: 0 });
    act(() => usePlayerStore.getState().shuffleQueue());
    expect(usePlayerStore.getState().queue).toEqual([songA]);
    expect(usePlayerStore.getState().currentIndex).toBe(0);
  });

  // --- プレイヤーオーバーレイ ---

  // #16 openPlayer
  it("openPlayer sets isPlayerOpen to true", () => {
    usePlayerStore.setState({ queue, currentIndex: 0, isPlayerOpen: false });
    act(() => usePlayerStore.getState().openPlayer());
    expect(usePlayerStore.getState().isPlayerOpen).toBe(true);
  });

  // #17 openPlayer with empty queue does nothing
  it("openPlayer with empty queue does nothing", () => {
    usePlayerStore.setState({ queue: [], currentIndex: -1, isPlayerOpen: false });
    act(() => usePlayerStore.getState().openPlayer());
    expect(usePlayerStore.getState().isPlayerOpen).toBe(false);
  });

  // #18 closePlayer
  it("closePlayer sets isPlayerOpen to false", () => {
    usePlayerStore.setState({ isPlayerOpen: true });
    act(() => usePlayerStore.getState().closePlayer());
    expect(usePlayerStore.getState().isPlayerOpen).toBe(false);
  });

  // #19 playSong opens player
  it("playSong also opens player", () => {
    usePlayerStore.setState({ isPlayerOpen: false });
    act(() => usePlayerStore.getState().playSong(songA, queue));
    expect(usePlayerStore.getState().isPlayerOpen).toBe(true);
  });
});
