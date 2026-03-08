export interface Song {
  songId: string;
  title: string;
  artist: string;
  performanceNote: string;
}

export interface Performance {
  performanceId: string;
  songId: string;
  videoId: string;
  startSeconds: number;
  endSeconds: number;
  publishedAt: string;
}

export interface Video {
  videoId: string;
  publishedAt: string;
  title: string;
  channelTitle: string;
  duration: string;
  viewCount: number;
  likeCount: number;
}

/** 配信動画（アルバム的な単位） */
export interface Stream {
  videoId: string;
  publishedAt: string;
  title: string;
  thumbnailUrl: string;
  songCount: number;
  duration: string;
  viewCount: number;
  likeCount: number;
  songs: SongPerformance[];
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
