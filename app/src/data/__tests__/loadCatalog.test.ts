import { describe, it, expect, vi } from "vitest";
import { CATALOG_FILES, catalogUrl, loadCatalog } from "../loadCatalog";

const CSV: Record<string, string> = {
  "app_songs_enriched.csv": "song_id,title,artist,performance_note\nsong_0001,天体観測,BUMP OF CHICKEN,\n",
  "app_performances.csv":
    "performance_id,song_id,video_id,start_seconds,end_seconds,published_at\n" +
    "perf_0001,song_0001,abc,0,300,2024-01-15T19:00:00Z\n",
  "app_videos.csv":
    "video_id,published_at,title,channel_title,duration,view_count,like_count\n" +
    "abc,2024-01-15T19:00:00Z,歌枠,ch,PT1H,10,1\n",
};

/** URL末尾のファイル名で CSV を返す fetch。status を上書きしたいファイルを指定できる */
function fakeFetch(statusOverrides: Record<string, number> = {}) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const file = CATALOG_FILES.find((f) => url.endsWith(`/data/${f}`));
    if (!file) return new Response("not found", { status: 404 });
    return new Response(CSV[file], { status: statusOverrides[file] ?? 200 });
  });
}

describe("loadCatalog", () => {
  // #1 BASE_URL 配下の data/ を指す
  it("builds the URL under BASE_URL", () => {
    expect(catalogUrl("app_videos.csv")).toBe(`${import.meta.env.BASE_URL}data/app_videos.csv`);
  });

  // #2 3ファイルを no-cache で取得し Catalog を組み立てる
  it("fetches the three CSVs with no-cache and builds a catalog", async () => {
    const fetchFn = fakeFetch();
    const catalog = await loadCatalog(fetchFn);

    expect(fetchFn).toHaveBeenCalledTimes(3);
    for (const file of CATALOG_FILES) {
      expect(fetchFn).toHaveBeenCalledWith(catalogUrl(file), { cache: "no-cache" });
    }
    expect(catalog.songPerformances[0].title).toBe("天体観測");
    expect(catalog.streams[0].title).toBe("歌枠");
  });

  // #3 1つでも HTTP エラーなら reject（部分データで表示しない）
  it("rejects when any response is not ok", async () => {
    await expect(loadCatalog(fakeFetch({ "app_videos.csv": 404 }))).rejects.toThrow(/app_videos\.csv/);
  });

  // #4 ネットワーク例外も reject
  it("rejects when fetch throws", async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(loadCatalog(fetchFn)).rejects.toThrow("Failed to fetch");
  });
});
