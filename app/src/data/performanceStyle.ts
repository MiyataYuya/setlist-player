import type { PerformanceStyle } from "./types";

/** 表示名。シートの 🎸/🎤 の呼び方に合わせる */
export const STYLE_LABEL: Record<PerformanceStyle, string> = {
  guitar: "弾き語り",
  karaoke: "歌枠",
};

/** 曲カードに添える記号（シートと同じもの） */
export const STYLE_MARK: Record<PerformanceStyle, string> = {
  guitar: "🎸",
  karaoke: "🎤",
};

/** 配信に含まれるスタイルを「弾き語り・歌枠」の形にする。無ければ空文字 */
export function formatStyles(styles: readonly PerformanceStyle[]): string {
  return styles.map((style) => STYLE_LABEL[style]).join("・");
}
