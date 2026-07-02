import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRecentSongs } from "../useRecentSongs";
import { useHistoryStore } from "../../stores/historyStore";

function entry(performanceId: string, playedAt: string) {
  return { performanceId, playedAt };
}

describe("useRecentSongs", () => {
  beforeEach(() => {
    useHistoryStore.setState({ history: [] });
  });

  // #1 履歴なし
  it("履歴が空なら空配列を返す", () => {
    const { result } = renderHook(() => useRecentSongs());
    expect(result.current).toEqual([]);
  });

  // #2 新しい順の変換
  it("履歴の順序（新しい順）で SongPerformance を返す", () => {
    useHistoryStore.setState({
      history: [entry("p3", "2024-03-01T00:00:00Z"), entry("p1", "2024-02-01T00:00:00Z")],
    });
    const { result } = renderHook(() => useRecentSongs());
    expect(result.current.map((s) => s.performanceId)).toEqual(["p3", "p1"]);
    expect(result.current[0].title).toBe("夜に駆ける");
  });

  // #3 重複排除（最新を優先）
  it("同じ performanceId は最新の1件だけ残す", () => {
    useHistoryStore.setState({
      history: [
        entry("p1", "2024-03-03T00:00:00Z"),
        entry("p2", "2024-03-02T00:00:00Z"),
        entry("p1", "2024-03-01T00:00:00Z"),
      ],
    });
    const { result } = renderHook(() => useRecentSongs());
    expect(result.current.map((s) => s.performanceId)).toEqual(["p1", "p2"]);
  });

  // #4 存在しないIDの除外
  it("songPerformances に存在しない ID は除外する", () => {
    useHistoryStore.setState({
      history: [entry("p999", "2024-03-02T00:00:00Z"), entry("p1", "2024-03-01T00:00:00Z")],
    });
    const { result } = renderHook(() => useRecentSongs());
    expect(result.current.map((s) => s.performanceId)).toEqual(["p1"]);
  });

  // #5 上限
  it("limit 件で打ち切る", () => {
    useHistoryStore.setState({
      history: [
        entry("p1", "2024-03-03T00:00:00Z"),
        entry("p2", "2024-03-02T00:00:00Z"),
        entry("p3", "2024-03-01T00:00:00Z"),
      ],
    });
    const { result } = renderHook(() => useRecentSongs(2));
    expect(result.current.map((s) => s.performanceId)).toEqual(["p1", "p2"]);
  });
});
