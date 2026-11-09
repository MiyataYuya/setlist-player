export interface Song {
  songId: string;
  title: string;
  artist: string;
  performanceNote: string;
}

/** 演奏スタイル。guitar=弾き語り / karaoke=歌枠（シートの 🎸/🎤） */
export type PerformanceStyle = "guitar" | "karaoke";

/** 表示・絞り込みで並べる固定順 */
export const PERFORMANCE_STYLES: readonly PerformanceStyle[] = ["guitar", "karaoke"];

export interface Performance {
  performanceId: string;
  songId: string;
  videoId: string;
  startSeconds: number;
  endSeconds: number;
  publishedAt: string;
  /** 分類なし（旧CSV・対応外の記号）は null */
  style: PerformanceStyle | null;
  /** その曲の何回目の歌唱か（1=初披露）。履歴列の無い旧CSVでは null */
  nth: number | null;
  /** 同じ曲の前回の歌唱からの日数。初披露・旧CSVでは null */
  gapDays: number | null;
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
  /** 含まれる演奏スタイル（重複なし、PERFORMANCE_STYLES の順） */
  styles: PerformanceStyle[];
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
  style: PerformanceStyle | null;
  /** その曲の何回目の歌唱か（1=初披露）。履歴列の無い旧CSVでは null */
  nth: number | null;
  /** 同じ曲の前回の歌唱からの日数。初披露・旧CSVでは null */
  gapDays: number | null;
}

/** 起動時に取得したCSVから組み立てる、アプリ全体の曲データ */
export interface Catalog {
  songs: Song[];
  performances: Performance[];
  videos: Video[];
  songPerformances: SongPerformance[];
  songPerformanceById: Map<string, SongPerformance>;
  /** songId → その曲の全演奏（配信日時降順） */
  songPerformancesBySongId: Map<string, SongPerformance[]>;
  /** 配信日時降順 */
  streams: Stream[];
  /** JSTの `YYYY-MM-DD` → その日の配信（同日内は開始が早い順） */
  streamsByDate: Map<string, Stream[]>;
  /** 配信がある日の `YYYY-MM-DD` 昇順 */
  streamDateKeys: string[];
  /** 配信のある最古の月から最新の月までの連続した `YYYY-MM` 昇順 */
  calendarMonths: string[];
}
