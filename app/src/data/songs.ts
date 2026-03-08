import rawSongs from "virtual:songs";
import rawPerformances from "virtual:performances";
import rawVideos from "virtual:videos";
import type { Song, Performance, SongPerformance, Stream, Video } from "./types";

export const songs: Song[] = rawSongs;
export const performances: Performance[] = rawPerformances;
export const videos: Video[] = rawVideos;

// 動画IDからVideoへのルックアップ
const videoMap = new Map<string, Video>(videos.map((v) => [v.videoId, v]));

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

/** 配信動画ごとにグループ化 (配信日時降順) */
export const streams: Stream[] = (() => {
  const map = new Map<string, SongPerformance[]>();
  for (const sp of songPerformances) {
    const list = map.get(sp.videoId) ?? [];
    list.push(sp);
    map.set(sp.videoId, list);
  }
  return Array.from(map.entries())
    .map(([videoId, songs]) => {
      const video = videoMap.get(videoId);
      return {
        videoId,
        publishedAt: songs[0].publishedAt,
        title: video?.title ?? "",
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        songCount: songs.length,
        duration: video?.duration ?? "",
        viewCount: video?.viewCount ?? 0,
        likeCount: video?.likeCount ?? 0,
        songs,
      };
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
})();

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
