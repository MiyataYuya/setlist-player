import { buildCatalog } from "./buildCatalog";
import { parsePerformancesCsv, parseSongsCsv, parseVideosCsv } from "./parseCatalog";
import type { Catalog } from "./types";

export const CATALOG_FILES = [
  "app_songs_enriched.csv",
  "app_performances.csv",
  "app_videos.csv",
] as const;

export function catalogUrl(file: string): string {
  return `${import.meta.env.BASE_URL}data/${file}`;
}

// 既定は window の fetch。変数に代入したまま呼んでも this 不整合にならないよう包む
const defaultFetch: typeof fetch = (input, init) => fetch(input, init);

async function fetchText(fetchFn: typeof fetch, file: string): Promise<string> {
  // no-cache: HTTPキャッシュがあっても必ずサーバーに再検証させ、古いCSVを掴まない
  const res = await fetchFn(catalogUrl(file), { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`${file} を取得できませんでした (HTTP ${res.status})`);
  }
  return res.text();
}

/** 曲データCSVを取得して Catalog を組み立てる。1つでも失敗したら reject */
export async function loadCatalog(fetchFn: typeof fetch = defaultFetch): Promise<Catalog> {
  const [songsCsv, performancesCsv, videosCsv] = await Promise.all(
    CATALOG_FILES.map((file) => fetchText(fetchFn, file))
  );
  return buildCatalog({
    songs: parseSongsCsv(songsCsv),
    performances: parsePerformancesCsv(performancesCsv),
    videos: parseVideosCsv(videosCsv),
  });
}
