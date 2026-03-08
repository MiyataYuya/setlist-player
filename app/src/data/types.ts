export interface Song {
  songId: string;
  title: string;
  artist: string;
}

export interface Performance {
  performanceId: string;
  songId: string;
  videoId: string;
  startSeconds: number;
  endSeconds: number;
  publishedAt: string;
}

/** UIで使う結合済みデータ */
export interface SongPerformance {
  performanceId: string;
  songId: string;
  title: string;
  artist: string;
  videoId: string;
  startSeconds: number;
  endSeconds: number;
  publishedAt: string;
  thumbnailUrl: string;
}
