import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCatalogStore, useCatalog, requireCatalog } from "../catalogStore";
import { testCatalog } from "../../test/catalogFixture";
import { CATALOG_FILES } from "../../data/loadCatalog";

const CSV: Record<string, string> = {
  "app_songs_enriched.csv": "song_id,title,artist,performance_note\nsong_0001,天体観測,BUMP OF CHICKEN,\n",
  "app_performances.csv":
    "performance_id,song_id,video_id,start_seconds,end_seconds,published_at\n" +
    "perf_0001,song_0001,abc,0,300,2024-01-15T19:00:00Z\n",
  "app_videos.csv":
    "video_id,published_at,title,channel_title,duration,view_count,like_count\n" +
    "abc,2024-01-15T19:00:00Z,歌枠,ch,PT1H,10,1\n",
};

const okFetch = vi.fn(async (input: RequestInfo | URL) => {
  const file = CATALOG_FILES.find((f) => String(input).endsWith(f));
  return new Response(file ? CSV[file] : "", { status: file ? 200 : 404 });
});

const failingFetch = vi.fn(async () => {
  throw new TypeError("Failed to fetch");
});

describe("catalogStore", () => {
  beforeEach(() => {
    // setup.ts は全テストで ready に初期化するため、ここでは未開始へ戻す
    useCatalogStore.setState({ status: "idle", catalog: null, error: null });
  });

  // #1 load 中は loading
  it("is loading while the catalog is being fetched", () => {
    const pending = useCatalogStore.getState().load(okFetch);
    expect(useCatalogStore.getState().status).toBe("loading");
    return pending;
  });

  // #2 成功で ready と catalog
  it("becomes ready with the loaded catalog", async () => {
    await useCatalogStore.getState().load(okFetch);
    const state = useCatalogStore.getState();
    expect(state.status).toBe("ready");
    expect(state.catalog?.songPerformances[0].title).toBe("天体観測");
    expect(state.error).toBeNull();
  });

  // #3 失敗で error
  it("becomes error when loading fails", async () => {
    await useCatalogStore.getState().load(failingFetch);
    const state = useCatalogStore.getState();
    expect(state.status).toBe("error");
    expect(state.catalog).toBeNull();
    expect(state.error?.message).toBe("Failed to fetch");
  });

  // #4 error から再試行で ready
  it("recovers on retry after an error", async () => {
    await useCatalogStore.getState().load(failingFetch);
    await useCatalogStore.getState().load(okFetch);
    expect(useCatalogStore.getState().status).toBe("ready");
  });
});

describe("useCatalog", () => {
  // #5 ready なら catalog を返す
  it("returns the catalog when ready", () => {
    useCatalogStore.setState({ status: "ready", catalog: testCatalog, error: null });
    const { result } = renderHook(() => useCatalog());
    expect(result.current).toBe(testCatalog);
  });

  // #6 ready 以外で使うのは契約違反なので throw
  // （描画中の例外の伝わり方は React のバージョンで変わるため、判定部分を純関数で検証する）
  it("requireCatalog throws when the catalog is not loaded", () => {
    expect(() => requireCatalog(null)).toThrow(/CatalogGate/);
    expect(requireCatalog(testCatalog)).toBe(testCatalog);
  });
});
