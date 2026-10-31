import { streams } from "./songs";
import { splitMonthKey, toJstDateKey, toMonthKey } from "./jstDate";
import type { Stream } from "./types";

/** 配信をJST基準の `YYYY-MM-DD` ごとにまとめる（同日内は開始が早い順） */
export function groupStreamsByJstDate(
  streamList: Stream[]
): Map<string, Stream[]> {
  const map = new Map<string, Stream[]>();
  for (const stream of streamList) {
    const key = toJstDateKey(stream.publishedAt);
    const list = map.get(key) ?? [];
    list.push(stream);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort(
      (a, b) =>
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
    );
  }
  return map;
}

/** 両端を含む連続した `YYYY-MM` の昇順リスト */
export function monthRange(fromMonthKey: string, toKey: string): string[] {
  const [fromYear, fromMonth] = splitMonthKey(fromMonthKey);
  const [toYear, toMonth] = splitMonthKey(toKey);

  const months: string[] = [];
  for (
    let index = fromYear * 12 + (fromMonth - 1);
    index <= toYear * 12 + (toMonth - 1);
    index++
  ) {
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;
    months.push(`${year}-${String(month).padStart(2, "0")}`);
  }
  return months;
}

/** 月グリッドの週ごとのセル列（日曜始まり、1日より前は空セル=null） */
export function buildMonthWeeks(monthKey: string): (string | null)[][] {
  const [year, month] = splitMonthKey(monthKey);
  // UTC で組むことで、実行環境のタイムゾーンに依存せず曜日・日数を求められる
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: (string | null)[] = Array(firstWeekday).fill(null);
  for (let day = 1; day <= dayCount; day++) {
    cells.push(`${monthKey}-${String(day).padStart(2, "0")}`);
  }

  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

/** JSTの日付 → その日の配信 */
export const streamsByDate: Map<string, Stream[]> =
  groupStreamsByJstDate(streams);

/** 配信がある日の `YYYY-MM-DD` 昇順リスト */
const streamDateKeys: string[] = Array.from(streamsByDate.keys()).sort();

/** 配信のある最古の月から最新の月までの連続した `YYYY-MM` 昇順リスト */
export const calendarMonths: string[] =
  streamDateKeys.length === 0
    ? []
    : monthRange(
        toMonthKey(streamDateKeys[0]),
        toMonthKey(streamDateKeys[streamDateKeys.length - 1])
      );

/** その月で最も新しい配信日（配信がなければ null） */
export function latestStreamDateInMonth(monthKey: string): string | null {
  for (let index = streamDateKeys.length - 1; index >= 0; index--) {
    if (streamDateKeys[index].startsWith(monthKey)) return streamDateKeys[index];
  }
  return null;
}
