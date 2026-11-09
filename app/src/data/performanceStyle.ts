import type { PerformanceStyle, SongPerformance } from "./types";

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

/** これ以上空いたら「久しぶり」とみなす日数（全歌唱のおよそ上位5%） */
export const LONG_GAP_DAYS = 180;

/** 曲カードに添える「初披露」「○か月ぶり」。どちらでもなければ null */
export function performanceBadge({
  nth,
  gapDays,
}: Pick<SongPerformance, "nth" | "gapDays">): string | null {
  if (nth === 1) return "初披露";
  if (gapDays !== null && gapDays >= LONG_GAP_DAYS) {
    return `${Math.floor(gapDays / 30)}か月ぶり`;
  }
  return null;
}
