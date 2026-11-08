import { describe, expect, it } from "vitest";
import path from "node:path";
import sharp from "sharp";

// 生成済みPNG（public/）に対する回帰テスト。
// アイコンは `npm run generate-pwa-assets` が SVG から焼くため、
// ここでは「焼き上がりが各プラットフォームの要件を満たすか」を検証する。
// Vitest の root は app/ なので cwd から解決する。
const publicDir = path.resolve(process.cwd(), "public");

type Pixel = { r: number; g: number; b: number; a: number };

type Raster = {
  width: number;
  height: number;
  at: (x: number, y: number) => Pixel;
};

async function readRaster(fileName: string): Promise<Raster> {
  const { data, info } = await sharp(path.join(publicDir, fileName))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  return {
    width,
    height,
    at: (x, y) => {
      const i = (y * width + x) * channels;
      return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
    },
  };
}

function corners(raster: Raster): Pixel[] {
  const { width: w, height: h, at } = raster;
  return [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
}

// 背景（濃色）とロゴ（ブランド色 #90caf9 / #f48fb1）を分ける閾値。
// 背景グラデーションの最も明るい端でも全チャンネル 80 未満に収める前提。
const LOGO_CHANNEL_THRESHOLD = 80;

const isLogoPixel = (p: Pixel) =>
  p.a > 0 && (p.r > LOGO_CHANNEL_THRESHOLD || p.g > LOGO_CHANNEL_THRESHOLD || p.b > LOGO_CHANNEL_THRESHOLD);

describe("PWAアイコン", () => {
  // Android のアダプティブアイコンは端を円形などに切り抜く。
  // 背景が端まで塗られていないと、切り抜き後に黒い四角が浮いて見える。
  it("maskable は四隅まで不透明な濃色で塗られている", async () => {
    const raster = await readRaster("maskable-icon-512x512.png");
    for (const p of corners(raster)) {
      expect(p.a).toBe(255);
      expect(Math.max(p.r, p.g, p.b)).toBeLessThan(LOGO_CHANNEL_THRESHOLD);
    }
  });

  // maskable のセーフゾーンは中央の直径80%の円。外側は切り落とされうる。
  it("maskable のロゴはセーフゾーン（直径80%の円）に収まっている", async () => {
    const raster = await readRaster("maskable-icon-512x512.png");
    const { width, height, at } = raster;
    const cx = (width - 1) / 2;
    const cy = (height - 1) / 2;
    const safeRadius = width * 0.4;

    let maxRadius = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (!isLogoPixel(at(x, y))) continue;
        maxRadius = Math.max(maxRadius, Math.hypot(x - cx, y - cy));
      }
    }

    expect(maxRadius).toBeGreaterThan(0); // ロゴが検出できていること自体を担保
    expect(maxRadius).toBeLessThanOrEqual(safeRadius);
  });

  // iOS は apple-touch-icon に自前で角丸マスクをかけるので、こちらも端まで塗る。
  // 透明や白のフチが残っていると、ホーム画面で枠付きに見える。
  it("apple-touch-icon は四隅まで不透明な濃色で塗られている", async () => {
    const raster = await readRaster("apple-touch-icon-180x180.png");
    for (const p of corners(raster)) {
      expect(p.a).toBe(255);
      expect(Math.max(p.r, p.g, p.b)).toBeLessThan(LOGO_CHANNEL_THRESHOLD);
    }
  });

  // purpose:any はマスクされずそのまま並ぶ（デスクトップPWA等）。
  // 角丸をアイコン自身が持つため、四隅は透明であってほしい。
  // 縮小時のリサンプリングで alpha が 0 にならずわずかに残ることがあるため、
  // 「不可視」を閾値で表す。角丸がなければ alpha は 255 になるので検出はできる。
  it.each(["pwa-64x64.png", "pwa-192x192.png", "pwa-512x512.png"])(
    "%s は角丸（四隅が透明）",
    async (fileName) => {
      const raster = await readRaster(fileName);
      for (const p of corners(raster)) {
        expect(p.a).toBeLessThanOrEqual(2);
      }
    },
  );
});
