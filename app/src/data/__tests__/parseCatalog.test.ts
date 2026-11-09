import { describe, it, expect } from "vitest";
import { parseSongsCsv, parsePerformancesCsv, parseVideosCsv } from "../parseCatalog";

describe("parseSongsCsv", () => {
  // #1 列名をアプリの型へ写す
  it("maps CSV columns to Song", () => {
    const csv = "song_id,title,artist,performance_note\nsong_0001,天体観測,BUMP OF CHICKEN,\n";
    expect(parseSongsCsv(csv)).toEqual([
      { songId: "song_0001", title: "天体観測", artist: "BUMP OF CHICKEN", performanceNote: "" },
    ]);
  });

  // #2 空行や song_id 空の行は除外
  it("skips rows without song_id", () => {
    const csv = "song_id,title,artist,performance_note\nsong_0001,A,X,\n,,,\n\n";
    expect(parseSongsCsv(csv)).toHaveLength(1);
  });

  // #3 必須列が無い（HTML 等の誤応答）なら黙って空にせず throw
  it("throws when a required column is missing", () => {
    expect(() => parseSongsCsv("<!doctype html><html></html>")).toThrow(/song_id/);
  });
});

describe("parsePerformancesCsv", () => {
  // #4 秒数を数値化（style 列の無い旧CSVでも読める＝style は null）
  it("converts seconds to numbers", () => {
    const csv =
      "performance_id,song_id,video_id,start_seconds,end_seconds,published_at\n" +
      "perf_0001,song_0001,abc,12,345,2024-01-15T19:00:00Z\n";
    expect(parsePerformancesCsv(csv)).toEqual([
      {
        performanceId: "perf_0001",
        songId: "song_0001",
        videoId: "abc",
        startSeconds: 12,
        endSeconds: 345,
        publishedAt: "2024-01-15T19:00:00Z",
        style: null,
      },
    ]);
  });

  // #4b 演奏スタイル列（列追加なので任意列として扱う）
  it("reads the performance style column", () => {
    const csv = [
      "performance_id,song_id,video_id,start_seconds,end_seconds,published_at,style",
      "perf_0001,song_0001,abc,0,300,2024-01-15T19:00:00Z,guitar",
      "perf_0002,song_0002,abc,300,600,2024-01-15T19:00:00Z,karaoke",
      "perf_0003,song_0003,abc,600,900,2024-01-15T19:00:00Z,",
      "perf_0004,song_0004,abc,900,1200,2024-01-15T19:00:00Z,unknown",
    ].join("\n");
    expect(parsePerformancesCsv(csv).map((p) => p.style)).toEqual([
      "guitar",
      "karaoke",
      null,
      null,
    ]);
  });

  // #5 必須列欠落で throw
  it("throws when a required column is missing", () => {
    expect(() => parsePerformancesCsv("performance_id,song_id\nperf_0001,song_0001\n")).toThrow(/video_id/);
  });
});

describe("parseVideosCsv", () => {
  // #6 数値化し、空の再生数・高評価数は 0
  it("converts counts to numbers and defaults blanks to 0", () => {
    const csv =
      "video_id,published_at,title,channel_title,duration,view_count,like_count\n" +
      "abc,2024-01-15T19:00:00Z,歌枠,ch,PT1H,1200,\n";
    expect(parseVideosCsv(csv)).toEqual([
      {
        videoId: "abc",
        publishedAt: "2024-01-15T19:00:00Z",
        title: "歌枠",
        channelTitle: "ch",
        duration: "PT1H",
        viewCount: 1200,
        likeCount: 0,
      },
    ]);
  });

  // #7 必須列欠落で throw
  it("throws when a required column is missing", () => {
    expect(() => parseVideosCsv("video_id\nabc\n")).toThrow(/title/);
  });
});
