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
      originalQueue: [],
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
    expect(s.originalQueue).toBe(queue);
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

  // #12 toggleShuffle ON: キューがシャッフルされ、現在の曲が先頭に来る
  it("toggleShuffle ON shuffles queue with current song at index 0", () => {
    usePlayerStore.setState({ queue: [...queue], originalQueue: [...queue], currentIndex: 2 });
    act(() => usePlayerStore.getState().toggleShuffle());
    const s = usePlayerStore.getState();
    expect(s.isShuffle).toBe(true);
    expect(s.currentIndex).toBe(0);
    // 現在の曲（songC）が先頭
    expect(s.queue[0].performanceId).toBe("c");
    // キューの長さは変わらない
    expect(s.queue.length).toBe(queue.length);
    // 全曲が含まれている
    const ids = s.queue.map((q) => q.performanceId).sort();
    expect(ids).toEqual(["a", "b", "c", "d", "e"]);
  });

  // #13 toggleShuffle OFF: 元のキュー順に戻り、現在の曲のindexが復元される
  it("toggleShuffle OFF restores original queue order", () => {
    usePlayerStore.setState({
      queue: [songC, songE, songA, songD, songB],
      originalQueue: [...queue],
      currentIndex: 0, // songC
      isShuffle: true,
    });
    act(() => usePlayerStore.getState().toggleShuffle());
    const s = usePlayerStore.getState();
    expect(s.isShuffle).toBe(false);
    expect(s.queue.map((q) => q.performanceId)).toEqual(["a", "b", "c", "d", "e"]);
    // songCの元のindex = 2
    expect(s.currentIndex).toBe(2);
  });

  // #14 playNext with shuffle: 順番に次へ進む（シャッフル済みキューの順序通り）
  it("playNext with shuffle advances through shuffled queue", () => {
    usePlayerStore.setState({
      queue: [songC, songA, songE, songB, songD],
      originalQueue: [...queue],
      currentIndex: 0,
      isPlaying: true,
      isShuffle: true,
    });
    act(() => usePlayerStore.getState().playNext());
    const s = usePlayerStore.getState();
    expect(s.currentIndex).toBe(1);
    expect(s.queue[s.currentIndex].performanceId).toBe("a");
  });

  // #15 playNext at end of shuffled queue with repeat=false
  it("playNext at end of shuffled queue with repeat=false stops", () => {
    usePlayerStore.setState({
      queue: [songC, songA, songE, songB, songD],
      originalQueue: [...queue],
      currentIndex: 4,
      isPlaying: true,
      isShuffle: true,
      isRepeat: false,
    });
    act(() => usePlayerStore.getState().playNext());
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  // #16 playNext at end of shuffled queue with repeat=true wraps
  it("playNext at end of shuffled queue with repeat=true wraps to 0", () => {
    usePlayerStore.setState({
      queue: [songC, songA, songE, songB, songD],
      originalQueue: [...queue],
      currentIndex: 4,
      isPlaying: true,
      isShuffle: true,
      isRepeat: true,
    });
    act(() => usePlayerStore.getState().playNext());
    expect(usePlayerStore.getState().currentIndex).toBe(0);
  });

  // #17 シャッフルON→曲選択→シャッフルOFF の一連フロー
  it("shuffle ON → play next → shuffle OFF preserves current song", () => {
    // 初期: songBを再生中
    act(() => usePlayerStore.getState().playSong(songB, [...queue]));

    // シャッフルON
    act(() => usePlayerStore.getState().toggleShuffle());
    const afterShuffle = usePlayerStore.getState();
    expect(afterShuffle.isShuffle).toBe(true);
    expect(afterShuffle.queue[0].performanceId).toBe("b"); // 現在の曲が先頭

    // 次の曲へ
    act(() => usePlayerStore.getState().playNext());
    const nextSong = usePlayerStore.getState().queue[usePlayerStore.getState().currentIndex];

    // シャッフルOFF
    act(() => usePlayerStore.getState().toggleShuffle());
    const afterUnshuffle = usePlayerStore.getState();
    expect(afterUnshuffle.isShuffle).toBe(false);
    // 元のキュー順に戻っている
    expect(afterUnshuffle.queue.map((q) => q.performanceId)).toEqual(["a", "b", "c", "d", "e"]);
    // 現在の曲が維持されている
    expect(afterUnshuffle.queue[afterUnshuffle.currentIndex].performanceId).toBe(
      nextSong.performanceId
    );
  });
});
