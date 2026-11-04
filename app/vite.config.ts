import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(__dirname, "../data");

/** アプリが起動時に取得する曲データ（src/data/loadCatalog.ts の CATALOG_FILES と一致させる） */
const CATALOG_FILES = [
  "app_songs_enriched.csv",
  "app_performances.csv",
  "app_videos.csv",
];

/**
 * 曲データCSVを `${base}data/` で配る。
 * dev: リポジトリの data/ をそのまま返す / build: dist/data/ に出力する。
 */
function catalogCsvPlugin(): Plugin {
  let base = "/";
  return {
    name: "catalog-csv",
    configResolved(config) {
      base = config.base;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? "").split("?")[0];
        const file = CATALOG_FILES.find((f) => pathname === `${base}data/${f}`);
        if (!file) return next();
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.end(fs.readFileSync(path.join(dataDir, file)));
      });
    },
    generateBundle() {
      for (const file of CATALOG_FILES) {
        this.emitFile({
          type: "asset",
          fileName: `data/${file}`,
          source: fs.readFileSync(path.join(dataDir, file)),
        });
      }
    },
  };
}

export default defineConfig({
  base: "/setlist-player/",
  plugins: [react(), catalogCsvPlugin()],
});
