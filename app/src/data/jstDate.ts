// 配信アーカイブの日付は閲覧者の居場所で変わるものではないため、
// 日付の区切りと表示は JST に固定する。日本はサマータイムがないので固定+9時間で厳密。
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 日曜始まりの曜日ラベル。添字は `getUTCDay()` と月グリッドの列に対応する */
export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

/** ISO文字列 → JST基準の `YYYY-MM-DD` */
export function toJstDateKey(iso: string): string {
  return new Date(new Date(iso).getTime() + JST_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

/** `YYYY-MM-DD` → `[年, 月, 日]` */
export function splitDateKey(dateKey: string): [number, number, number] {
  const [year, month, day] = dateKey.split("-").map(Number);
  return [year, month, day];
}

/** `YYYY-MM` → `[年, 月]` */
export function splitMonthKey(monthKey: string): [number, number] {
  const [year, month] = monthKey.split("-").map(Number);
  return [year, month];
}

/** `YYYY-MM-DD` → `YYYY-MM` */
export function toMonthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

/** ISO文字列 → JST基準の日付表示（例: `2024/1/16`）。空入力は空文字。 */
export function formatJstDate(iso: string): string {
  if (!iso) return "";
  const [year, month, day] = splitDateKey(toJstDateKey(iso));
  return `${year}/${month}/${day}`;
}

/** `YYYY-MM-DD` → `2024年2月11日（日）` */
export function formatDateKeyLabel(dateKey: string): string {
  const [year, month, day] = splitDateKey(dateKey);
  // 日付キーはすでに暦日なので、UTCで組んで実行環境のタイムゾーンから切り離す
  const weekday =
    WEEKDAY_LABELS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${year}年${month}月${day}日（${weekday}）`;
}

/** `YYYY-MM` → `2024年3月` */
export function formatMonthKeyLabel(monthKey: string): string {
  const [year, month] = splitMonthKey(monthKey);
  return `${year}年${month}月`;
}
