import { CATALOG_FILES, catalogUrl } from "./loadCatalog";

/** warmCatalogCache が必要とする ServiceWorkerContainer の最小部分 */
interface WarmableContainer {
  controller: unknown | null;
  ready: Promise<{ active: { postMessage(message: unknown): void } | null }>;
}

/**
 * 初回訪問でも曲データCSVを catalog-csv キャッシュに入れておく。
 *
 * registerType が "prompt" だと clientsClaim されないため、初回訪問のページは
 * Service Worker に制御されず、loadCatalog の fetch がSWを通らずキャッシュに残らない。
 * そのままだと次回がオフライン起動のとき曲データを読めない。
 * 未制御のときだけ、SW が有効になるのを待ち、Workbox 標準の CACHE_URLS メッセージで
 * 同じCSVをSW経由で取得・保存させる（初回オンライン起動分をオフラインで使えるようにする）。
 * 既に制御されているページは loadCatalog の fetch が SW のルートを通るので何もしない。
 */
export async function warmCatalogCache(
  container: WarmableContainer | undefined = globalThis.navigator?.serviceWorker
): Promise<void> {
  if (!container || container.controller) return;
  const registration = await container.ready;
  registration.active?.postMessage({
    type: "CACHE_URLS",
    payload: { urlsToCache: CATALOG_FILES.map(catalogUrl) },
  });
}
