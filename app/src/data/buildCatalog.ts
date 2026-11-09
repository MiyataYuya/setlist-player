import { groupStreamsByJstDate, monthRange } from "./calendar";
import { toMonthKey } from "./jstDate";
import { PERFORMANCE_STYLES } from "./types";
import type { Catalog, Performance, Song, SongPerformance, Stream, Video } from "./types";

export interface CatalogSource {
  songs: Song[];
  performances: Performance[];
  videos: Video[];
}

function thumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/** パース済みの3表から、画面が使う結合・集計済みデータを組み立てる */
export function buildCatalog({ songs, performances, videos }: CatalogSource): Catalog {
  const songMap = new Map(songs.map((s) => [s.songId, s]));
  const videoMap = new Map(videos.map((v) => [v.videoId, v]));

  const songPerformances: SongPerformance[] = performances.map((p) => {
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
      thumbnailUrl: thumbnailUrl(p.videoId),
      style: p.style,
    };
  });

  const songPerformanceById = new Map(songPerformances.map((sp) => [sp.performanceId, sp]));

  const byVideo = new Map<string, SongPerformance[]>();
  for (const sp of songPerformances) {
    const list = byVideo.get(sp.videoId) ?? [];
    list.push(sp);
    byVideo.set(sp.videoId, list);
  }
  const streams: Stream[] = Array.from(byVideo.entries())
    .map(([videoId, streamSongs]) => {
      const video = videoMap.get(videoId);
      return {
        videoId,
        publishedAt: streamSongs[0].publishedAt,
        title: video?.title ?? "",
        thumbnailUrl: thumbnailUrl(videoId),
        songCount: streamSongs.length,
        duration: video?.duration ?? "",
        viewCount: video?.viewCount ?? 0,
        likeCount: video?.likeCount ?? 0,
        styles: PERFORMANCE_STYLES.filter((style) =>
          streamSongs.some((sp) => sp.style === style)
        ),
        songs: streamSongs,
      };
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const streamsByDate = groupStreamsByJstDate(streams);
  const streamDateKeys = Array.from(streamsByDate.keys()).sort();
  const calendarMonths =
    streamDateKeys.length === 0
      ? []
      : monthRange(
          toMonthKey(streamDateKeys[0]),
          toMonthKey(streamDateKeys[streamDateKeys.length - 1])
        );

  return {
    songs,
    performances,
    videos,
    songPerformances,
    songPerformanceById,
    streams,
    streamsByDate,
    streamDateKeys,
    calendarMonths,
  };
}
