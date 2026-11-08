import { defineConfig } from "@vite-pwa/assets-generator/config";

// purpose:any のアイコンと favicon。角丸を持つ public/icon.svg をそのまま焼く。
//
// padding は全タイプ 0 にしている。余白はソースSVG側で設計済みで、
// generator 既定の padding（transparent 0.05 / maskable・apple 0.3）を効かせると
// 背景ごと縮小され、透明や白のフチが残ってしまうため。
//
// maskable と apple は全面塗りのソースが必要なので pwa-assets.maskable.config.ts が担当する。
// CLI は 1 回の実行で 1 ソースしか扱えず（複数指定しても同名ファイルを上書きし合う）、
// 生成しない種別は sizes を空にして設定を 2 つに分けている。
export default defineConfig({
  images: ["public/icon.svg"],
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      padding: 0,
      favicons: [[48, "favicon.ico"]],
    },
    maskable: { sizes: [] },
    apple: { sizes: [] },
  },
});
