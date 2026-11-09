import { buildCatalog } from "../data/buildCatalog";
import type { Catalog, Performance, Song, Video } from "../data/types";

export const fixtureSongs: Song[] = [
  { songId: "s1", title: "天体観測", artist: "BUMP OF CHICKEN", performanceNote: "" },
  { songId: "s2", title: "紅蓮華", artist: "LiSA", performanceNote: "" },
  { songId: "s3", title: "夜に駆ける", artist: "YOASOBI", performanceNote: "" },
  { songId: "s4", title: "Lemon", artist: "米津玄師", performanceNote: "" },
  { songId: "s5", title: "残酷な天使のテーゼ", artist: "高橋洋子", performanceNote: "" },
];

// v1=弾き語りのみ / v2・v4=歌枠のみ / v3=弾き語り・歌枠の混在 / v5=弾き語りのみ
export const fixturePerformances: Performance[] = [
  { performanceId: "p1", songId: "s1", videoId: "v1", startSeconds: 0, endSeconds: 300, publishedAt: "2024-01-15T19:00:00Z", style: "guitar", nth: 1, gapDays: null },
  { performanceId: "p2", songId: "s2", videoId: "v1", startSeconds: 310, endSeconds: 600, publishedAt: "2024-01-15T19:00:00Z", style: "guitar", nth: 1, gapDays: null },
  { performanceId: "p3", songId: "s3", videoId: "v2", startSeconds: 0, endSeconds: 250, publishedAt: "2024-02-10T19:00:00Z", style: "karaoke", nth: 1, gapDays: null },
  { performanceId: "p4", songId: "s1", videoId: "v2", startSeconds: 260, endSeconds: 560, publishedAt: "2024-02-10T19:00:00Z", style: "karaoke", nth: 2, gapDays: 26 },
  { performanceId: "p5", songId: "s4", videoId: "v3", startSeconds: 0, endSeconds: 280, publishedAt: "2024-03-05T19:00:00Z", style: "guitar", nth: 1, gapDays: null },
  { performanceId: "p6", songId: "s5", videoId: "v3", startSeconds: 290, endSeconds: 580, publishedAt: "2024-03-05T19:00:00Z", style: "karaoke", nth: 1, gapDays: null },
  { performanceId: "p7", songId: "s2", videoId: "v3", startSeconds: 590, endSeconds: 870, publishedAt: "2024-03-05T19:00:00Z", style: "guitar", nth: 2, gapDays: 50 },
  { performanceId: "p8", songId: "s3", videoId: "v4", startSeconds: 0, endSeconds: 240, publishedAt: "2024-03-05T22:00:00Z", style: "karaoke", nth: 2, gapDays: 24 },
  { performanceId: "p9", songId: "s4", videoId: "v5", startSeconds: 0, endSeconds: 260, publishedAt: "2024-03-20T19:00:00Z", style: "guitar", nth: 2, gapDays: 15 },
];

export const fixtureVideos: Video[] = [
  { videoId: "v1", publishedAt: "2024-01-15T19:00:00Z", title: "【歌枠】新年歌配信！", channelTitle: "テスト", duration: "PT1H", viewCount: 10000, likeCount: 500 },
  { videoId: "v2", publishedAt: "2024-02-10T19:00:00Z", title: "singing stream #歌枠 #karaoke", channelTitle: "テスト", duration: "PT1H30M", viewCount: 20000, likeCount: 1000 },
  { videoId: "v3", publishedAt: "2024-03-05T19:00:00Z", title: "歌配信 - ミナミイズミ ch", channelTitle: "テスト", duration: "PT2H", viewCount: 30000, likeCount: 1500 },
  // v4 は v3 と同じJST日（2024-03-06）＝「同じ日に2配信」のケース
  { videoId: "v4", publishedAt: "2024-03-05T22:00:00Z", title: "【コラボ】二人で歌枠", channelTitle: "テスト", duration: "PT1H", viewCount: 5000, likeCount: 300 },
  // v5 は同月の別日＝「1か月に複数の配信日」のケース
  { videoId: "v5", publishedAt: "2024-03-20T19:00:00Z", title: "【歌枠】春の歌配信", channelTitle: "テスト", duration: "PT1H", viewCount: 8000, likeCount: 400 },
];

/** テスト全体の既定データ（setup.ts で catalogStore に入れる） */
export const testCatalog: Catalog = buildCatalog({
  songs: fixtureSongs,
  performances: fixturePerformances,
  videos: fixtureVideos,
});
