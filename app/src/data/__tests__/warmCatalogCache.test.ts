import { describe, it, expect, vi } from "vitest";
import { warmCatalogCache } from "../warmCatalogCache";
import { CATALOG_FILES, catalogUrl } from "../loadCatalog";

describe("warmCatalogCache", () => {
  // #1 SW に制御されていない初回訪問では、SW にCSVのキャッシュを依頼する
  it("asks the active service worker to cache the catalog CSVs when the page is uncontrolled", async () => {
    const postMessage = vi.fn();
    const container = { controller: null, ready: Promise.resolve({ active: { postMessage } }) };
    await warmCatalogCache(container);
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({
      type: "CACHE_URLS",
      payload: { urlsToCache: CATALOG_FILES.map(catalogUrl) },
    });
  });

  // #2 既に制御されていれば loadCatalog の fetch が SW 経由なので何もしない（ready も待たない）
  it("does nothing when the page is already controlled", async () => {
    const postMessage = vi.fn();
    const ready = vi.fn();
    const container = {
      controller: {},
      get ready() {
        ready();
        return Promise.resolve({ active: { postMessage } });
      },
    };
    await warmCatalogCache(container);
    expect(postMessage).not.toHaveBeenCalled();
    expect(ready).not.toHaveBeenCalled();
  });

  // #3 Service Worker 非対応環境でも例外にしない
  it("resolves when service workers are unsupported", async () => {
    await expect(warmCatalogCache(undefined)).resolves.toBeUndefined();
  });

  // #4 active な SW が無ければ何もせず終わる
  it("posts nothing when the registration has no active worker", async () => {
    const container = { controller: null, ready: Promise.resolve({ active: null }) };
    await expect(warmCatalogCache(container)).resolves.toBeUndefined();
  });
});
