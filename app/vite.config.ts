import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
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
  plugins: [
    react(),
    catalogCsvPlugin(),
    VitePWA({
      // 更新は UpdatePrompt で利用者に委ねる（再生中に勝手に再読み込みしない）
      registerType: "prompt",
      // 登録は UpdatePrompt の useRegisterSW が行う
      injectRegister: false,
      includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png", "icon.svg"],
      manifest: {
        name: "セトリプレイヤー",
        short_name: "セトリプレイヤー",
        description: "配信アーカイブの歌をブラウズ・再生するプレイヤー",
        lang: "ja",
        start_url: "/setlist-player/",
        scope: "/setlist-player/",
        display: "standalone",
        theme_color: "#121212",
        background_color: "#121212",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // アプリ本体のみ precache。CSV は含めない（precache はリビジョン固定で下の NetworkFirst より優先されるため）
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        globIgnores: ["404.html"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/\/data\//],
        // 配信者の権利保護: ランタイムキャッシュは同一オリジンの曲データCSVだけ。
        // YouTube（埋め込み・サムネイル・IFrame API）はルートを持たない＝一切キャッシュしない。
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\/data\/[^/]+\.csv$/.test(url.pathname),
            handler: "NetworkFirst",
            options: {
              cacheName: "catalog-csv",
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
});
