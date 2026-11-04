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

/** 起動時に取得したCSVから組み立てる、アプリ全体の曲データ */
export interface Catalog {
  songs: Song[];
  performances: Performance[];
  videos: Video[];
  songPerformances: SongPerformance[];
  songPerformanceById: Map<string, SongPerformance>;
  /** 配信日時降順 */
  streams: Stream[];
  /** JSTの `YYYY-MM-DD` → その日の配信（同日内は開始が早い順） */
  streamsByDate: Map<string, Stream[]>;
  /** 配信がある日の `YYYY-MM-DD` 昇順 */
  streamDateKeys: string[];
  /** 配信のある最古の月から最新の月までの連続した `YYYY-MM` 昇順 */
  calendarMonths: string[];
}
