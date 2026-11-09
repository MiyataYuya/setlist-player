import Papa from "papaparse";
import { PERFORMANCE_STYLES } from "./types";
import type { Performance, PerformanceStyle, Song, Video } from "./types";

interface RawSong {
  song_id: string;
  title: string;
  artist: string;
  performance_note?: string;
}

interface RawPerformance {
  performance_id: string;
  song_id: string;
  video_id: string;
  start_seconds: string;
  end_seconds: string;
  published_at: string;
  /** 後から追加した列。旧CSVには無い */
  style?: string;
}

interface RawVideo {
  video_id: string;
  published_at: string;
  title: string;
  channel_title: string;
  duration: string;
  view_count: string;
  like_count: string;
}

/**
 * ヘッダー付きCSVを行オブジェクトにする。必須列が欠けていたら throw する
 * （HTMLなどの誤応答を「0件のデータ」として黙って通さないため）。
 */
function parseRows<T>(csv: string, required: readonly (keyof T & string)[]): T[] {
  const { data, meta } = Papa.parse<T>(csv, { header: true, skipEmptyLines: true });
  const fields = meta.fields ?? [];
  const missing = required.filter((column) => !fields.includes(column));
  if (missing.length > 0) {
    throw new Error(`CSVに必須列がありません: ${missing.join(", ")}`);
  }
  return data;
}

export function parseSongsCsv(csv: string): Song[] {
  return parseRows<RawSong>(csv, ["song_id", "title", "artist"])
    .filter((r) => r.song_id)
    .map((r) => ({
      songId: r.song_id,
      title: r.title,
      artist: r.artist,
      performanceNote: r.performance_note || "",
    }));
}

function parseStyle(raw: string | undefined): PerformanceStyle | null {
  return PERFORMANCE_STYLES.find((style) => style === raw) ?? null;
}

export function parsePerformancesCsv(csv: string): Performance[] {
  return parseRows<RawPerformance>(csv, [
    "performance_id",
    "song_id",
    "video_id",
    "start_seconds",
    "end_seconds",
    "published_at",
  ])
    .filter((r) => r.performance_id)
    .map((r) => ({
      performanceId: r.performance_id,
      songId: r.song_id,
      videoId: r.video_id,
      startSeconds: Number(r.start_seconds),
      endSeconds: Number(r.end_seconds),
      publishedAt: r.published_at,
      style: parseStyle(r.style),
    }));
}

export function parseVideosCsv(csv: string): Video[] {
  return parseRows<RawVideo>(csv, [
    "video_id",
    "published_at",
    "title",
    "channel_title",
    "duration",
    "view_count",
    "like_count",
  ])
    .filter((r) => r.video_id)
    .map((r) => ({
      videoId: r.video_id,
      publishedAt: r.published_at,
      title: r.title,
      channelTitle: r.channel_title,
      duration: r.duration,
      viewCount: Number(r.view_count) || 0,
      likeCount: Number(r.like_count) || 0,
    }));
}
