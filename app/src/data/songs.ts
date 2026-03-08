import rawSongs from "virtual:songs";
import rawPerformances from "virtual:performances";
import type { Song, Performance, SongPerformance } from "./types";

export const songs: Song[] = rawSongs;
export const performances: Performance[] = rawPerformances;

// 曲IDからSongへのルックアップ
const songMap = new Map<string, Song>(songs.map((s) => [s.songId, s]));

// パフォーマンスとSongを結合した配列
export const songPerformances: SongPerformance[] = performances.map((p) => {
  const song = songMap.get(p.songId);
  return {
    performanceId: p.performanceId,
    songId: p.songId,
    title: song?.title ?? "",
    artist: song?.artist ?? "",
    videoId: p.videoId,
    startSeconds: p.startSeconds,
    endSeconds: p.endSeconds,
    publishedAt: p.publishedAt,
    thumbnailUrl: `https://img.youtube.com/vi/${p.videoId}/mqdefault.jpg`,
  };
});

/** ユニーク曲名の一覧 (再生回数降順) */
export function getUniqueSongs(): (Song & { playCount: number })[] {
  const counts = new Map<string, number>();
  for (const p of performances) {
    counts.set(p.songId, (counts.get(p.songId) ?? 0) + 1);
  }
  return songs
    .map((s) => ({ ...s, playCount: counts.get(s.songId) ?? 0 }))
    .sort((a, b) => b.playCount - a.playCount);
}
