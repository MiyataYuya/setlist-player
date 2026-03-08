import { describe, it, expect } from "vitest";
import { songs, performances, videos, songPerformances, streams, getUniqueSongs } from "../songs";

describe("data/songs", () => {
  // #1 songPerformances join
  it("songPerformances joins Performance and Song by songId", () => {
    const sp = songPerformances.find((s) => s.performanceId === "p1");
    expect(sp).toBeDefined();
    expect(sp!.title).toBe("天体観測");
    expect(sp!.artist).toBe("BUMP OF CHICKEN");
    expect(sp!.videoId).toBe("v1");
  });

  // #2 missing songId (not applicable with our mock data but test the structure)
  it("songPerformances has title/artist from song data", () => {
    for (const sp of songPerformances) {
      expect(typeof sp.title).toBe("string");
      expect(typeof sp.artist).toBe("string");
    }
  });

  // #3 thumbnailUrl format
  it("generates thumbnailUrl in correct format", () => {
    for (const sp of songPerformances) {
      expect(sp.thumbnailUrl).toBe(
        `https://img.youtube.com/vi/${sp.videoId}/mqdefault.jpg`
      );
    }
  });

  // #4 getUniqueSongs
  it("getUniqueSongs returns unique songs sorted by playCount desc", () => {
    const unique = getUniqueSongs();
    expect(unique.length).toBe(songs.length);
    for (let i = 1; i < unique.length; i++) {
      expect(unique[i - 1].playCount).toBeGreaterThanOrEqual(unique[i].playCount);
    }
  });

  // #5 streams grouping
  it("streams are grouped by videoId", () => {
    const videoIds = streams.map((s) => s.videoId);
    expect(new Set(videoIds).size).toBe(videoIds.length); // no duplicates
  });

  // #6 streams sorted by date descending
  it("streams are sorted by publishedAt desc", () => {
    for (let i = 1; i < streams.length; i++) {
      const prev = new Date(streams[i - 1].publishedAt).getTime();
      const curr = new Date(streams[i].publishedAt).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  // #7 streams title from video
  it("streams.title comes from Video data", () => {
    const stream = streams.find((s) => s.videoId === "v1");
    expect(stream).toBeDefined();
    expect(stream!.title).toBe("【歌枠】新年歌配信！");
  });

  // #8 streams.songCount
  it("streams.songCount matches number of performances in group", () => {
    for (const stream of streams) {
      expect(stream.songCount).toBe(stream.songs.length);
    }
  });

  // #9 streams viewCount/likeCount
  it("streams viewCount/likeCount from Video data", () => {
    const stream = streams.find((s) => s.videoId === "v3");
    expect(stream).toBeDefined();
    expect(stream!.viewCount).toBe(30000);
    expect(stream!.likeCount).toBe(1500);
  });
});
