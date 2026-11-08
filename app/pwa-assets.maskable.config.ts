import { defineConfig } from "@vite-pwa/assets-generator/config";

// OS 側がマスクをかけるアイコン。全面塗りの public/icon-maskable.svg から焼く。
// apple-touch-icon も iOS が自前で角丸にするので、角丸なし・全面塗りのこちらが正しいソース。
// 設定を 2 つに分けている理由は pwa-assets.config.ts のコメントを参照。
export default defineConfig({
  images: ["public/icon-maskable.svg"],
  preset: {
    transparent: { sizes: [] },
    maskable: { sizes: [512], padding: 0 },
    apple: {
      sizes: [180],
      padding: 0,
      // ソースが不透明なので実際には露出しないが、既定の白背景に戻らないよう明示する
      resizeOptions: { background: "#121212" },
    },
  },
});
