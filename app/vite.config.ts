import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const dataDir = path.resolve(__dirname, "../data");

interface RawSong {
  song_id: string;
  title: string;
  artist: string;
}

interface RawPerformance {
  performance_id: string;
  song_id: string;
  video_id: string;
  start_seconds: string;
  end_seconds: string;
  published_at: string;
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

function csvDataPlugin(): Plugin {
  const VIRTUAL_SONGS = "virtual:songs";
  const VIRTUAL_PERFORMANCES = "virtual:performances";
  const VIRTUAL_VIDEOS = "virtual:videos";
  const RESOLVED_SONGS = "\0" + VIRTUAL_SONGS;
  const RESOLVED_PERFORMANCES = "\0" + VIRTUAL_PERFORMANCES;
  const RESOLVED_VIDEOS = "\0" + VIRTUAL_VIDEOS;

  return {
    name: "csv-data",
    resolveId(id) {
      if (id === VIRTUAL_SONGS) return RESOLVED_SONGS;
      if (id === VIRTUAL_PERFORMANCES) return RESOLVED_PERFORMANCES;
      if (id === VIRTUAL_VIDEOS) return RESOLVED_VIDEOS;
    },
    load(id) {
      if (id === RESOLVED_SONGS) {
        const csv = fs.readFileSync(
          path.join(dataDir, "app_songs.csv"),
          "utf-8"
        );
        const { data } = Papa.parse<RawSong>(csv, { header: true });
        const parsed = data
          .filter((r) => r.song_id)
          .map((r) => ({
            songId: r.song_id,
            title: r.title,
            artist: r.artist,
          }));
        return `export default ${JSON.stringify(parsed)};`;
      }
      if (id === RESOLVED_PERFORMANCES) {
        const csv = fs.readFileSync(
          path.join(dataDir, "app_performances.csv"),
          "utf-8"
        );
        const { data } = Papa.parse<RawPerformance>(csv, { header: true });
        const parsed = data
          .filter((r) => r.performance_id)
          .map((r) => ({
            performanceId: r.performance_id,
            songId: r.song_id,
            videoId: r.video_id,
            startSeconds: Number(r.start_seconds),
            endSeconds: Number(r.end_seconds),
            publishedAt: r.published_at,
          }));
        return `export default ${JSON.stringify(parsed)};`;
      }
      if (id === RESOLVED_VIDEOS) {
        const csv = fs.readFileSync(
          path.join(dataDir, "app_videos.csv"),
          "utf-8"
        );
        const { data } = Papa.parse<RawVideo>(csv, { header: true });
        const parsed = data
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
        return `export default ${JSON.stringify(parsed)};`;
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), csvDataPlugin()],
});
