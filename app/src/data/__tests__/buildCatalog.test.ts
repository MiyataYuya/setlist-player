import { describe, it, expect } from "vitest";
import { buildCatalog } from "../buildCatalog";
import { fixturePerformances, fixtureSongs, fixtureVideos } from "../../test/catalogFixture";

const catalog = buildCatalog({
  songs: fixtureSongs,
  performances: fixturePerformances,
  videos: fixtureVideos,
});

describe("buildCatalog", () => {
  // #1 Performance と Song を songId で結合
  it("joins performances with songs by songId", () => {
    const sp = catalog.songPerformances.find((s) => s.performanceId === "p1");
    expect(sp?.title).toBe("天体観測");
    expect(sp?.artist).toBe("BUMP OF CHICKEN");
    expect(sp?.videoId).toBe("v1");
  });

  // #2 サムネイルURLの形式
  it("generates thumbnailUrl in the YouTube format", () => {
    for (const sp of catalog.songPerformances) {
      expect(sp.thumbnailUrl).toBe(`https://img.youtube.com/vi/${sp.videoId}/mqdefault.jpg`);
    }
  });

  // #3 performanceId ルックアップ
  it("looks up a performance by id", () => {
    expect(catalog.songPerformanceById.get("p1")?.title).toBe("天体観測");
    expect(catalog.songPerformanceById.size).toBe(catalog.songPerformances.length);
    expect(catalog.songPerformanceById.get("nope")).toBeUndefined();
  });

  // #4 配信は videoId ごとに1件
  it("groups streams by videoId", () => {
    const ids = catalog.streams.map((s) => s.videoId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // #5 配信は日時降順
  it("sorts streams by publishedAt desc", () => {
    for (let i = 1; i < catalog.streams.length; i++) {
      expect(new Date(catalog.streams[i - 1].publishedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(catalog.streams[i].publishedAt).getTime()
      );
    }
  });

  // #6 配信のタイトル・再生数は Video から
  it("takes stream title and counts from videos", () => {
    expect(catalog.streams.find((s) => s.videoId === "v1")?.title).toBe("【歌枠】新年歌配信！");
    const v3 = catalog.streams.find((s) => s.videoId === "v3");
    expect(v3?.viewCount).toBe(30000);
    expect(v3?.likeCount).toBe(1500);
  });

  // #7 songCount は配信内の演奏数
  it("sets songCount to the number of performances in the stream", () => {
    for (const stream of catalog.streams) {
      expect(stream.songCount).toBe(stream.songs.length);
    }
  });

  // #8 カレンダーの月はフィクスチャの 2024-01〜03 を昇順で
  it("covers the months of the streams in ascending order", () => {
    expect(catalog.calendarMonths).toEqual(["2024-01", "2024-02", "2024-03"]);
  });

  // #9 JSTの日付で配信を引ける（UTC 19時は翌日）
  it("indexes streams by JST date", () => {
    expect(catalog.streamsByDate.get("2024-01-16")?.[0].videoId).toBe("v1");
  });

  // #10 配信日は昇順（v3/v4 は同じJST日なので1件）
  it("lists stream dates ascending without duplicates", () => {
    expect(catalog.streamDateKeys).toEqual(["2024-01-16", "2024-02-11", "2024-03-06", "2024-03-21"]);
  });

  // #11 配信が無ければカレンダー月も空
  it("returns no calendar months for an empty catalog", () => {
    const empty = buildCatalog({ songs: [], performances: [], videos: [] });
    expect(empty.calendarMonths).toEqual([]);
    expect(empty.streams).toEqual([]);
  });

  // 演奏スタイルを曲に引き継ぐ
  it("carries the performance style onto song performances", () => {
    expect(catalog.songPerformanceById.get("p1")?.style).toBe("guitar");
    expect(catalog.songPerformanceById.get("p3")?.style).toBe("karaoke");
  });

  // 配信は含まれるスタイルを重複なく、弾き語り→歌枠の順で持つ
  it("lists the styles each stream contains", () => {
    const styles = (videoId: string) =>
      catalog.streams.find((s) => s.videoId === videoId)?.styles;
    expect(styles("v1")).toEqual(["guitar"]);
    expect(styles("v2")).toEqual(["karaoke"]);
    // v3 は弾き語り・歌枠の混在
    expect(styles("v3")).toEqual(["guitar", "karaoke"]);
  });

  // スタイル不明の演奏は配信のスタイルに数えない
  it("ignores performances without a style when listing stream styles", () => {
    const c = buildCatalog({
      songs: fixtureSongs,
      performances: [{ ...fixturePerformances[0], style: null }],
      videos: fixtureVideos,
    });
    expect(c.streams[0].styles).toEqual([]);
  });

  // 曲（songId）ごとの全演奏。曲ページで使う
  it("groups performances by song, newest first", () => {
    expect(
      catalog.songPerformancesBySongId.get("s1")?.map((s) => s.performanceId)
    ).toEqual(["p4", "p1"]);
    expect(catalog.songPerformancesBySongId.get("nope")).toBeUndefined();
  });

  // 歌唱履歴を曲に引き継ぐ
  it("carries the singing history onto song performances", () => {
    const p4 = catalog.songPerformanceById.get("p4");
    expect([p4?.nth, p4?.gapDays]).toEqual([2, 26]);
  });
});
