import { useMemo } from "react";
import { songPerformances } from "../data/songs";
import { useHistoryStore } from "../stores/historyStore";
import type { SongPerformance } from "../data/types";

const spMap = new Map(songPerformances.map((s) => [s.performanceId, s]));

/** 再生履歴から重複を除いた最近の曲を返す（新しい順、存在しない演奏は除外） */
export function useRecentSongs(limit = 10): SongPerformance[] {
  const history = useHistoryStore((s) => s.history);

  return useMemo(() => {
    const seen = new Set<string>();
    const result: SongPerformance[] = [];
    for (const h of history) {
      if (result.length >= limit) break;
      if (seen.has(h.performanceId)) continue;
      seen.add(h.performanceId);
      const sp = spMap.get(h.performanceId);
      if (sp) result.push(sp);
    }
    return result;
  }, [history, limit]);
}
