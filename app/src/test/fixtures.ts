import type { Stream } from "../data/types";

/** テスト用の最小限の Stream。日付まわりの検証では publishedAt だけが効く。 */
export function makeStream(videoId: string, publishedAt: string): Stream {
  return {
    videoId,
    publishedAt,
    title: `title-${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    songCount: 1,
    duration: "PT1H",
    viewCount: 0,
    likeCount: 0,
    songs: [],
  };
}
