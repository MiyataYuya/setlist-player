import { describe, it, expect } from "vitest";
import {
  groupStreamsByJstDate,
  monthRange,
  buildMonthWeeks,
  latestStreamDateInMonth,
  streamsByDate,
  calendarMonths,
} from "../calendar";
import { makeStream } from "../../test/fixtures";

describe("groupStreamsByJstDate", () => {
  // #1 JSTで日付を切る（UTC夜の配信は翌日扱い）
  it("buckets a stream under its JST date", () => {
    const map = groupStreamsByJstDate([makeStream("v1", "2024-01-15T19:00:00Z")]);
    expect(map.has("2024-01-16")).toBe(true);
    expect(map.has("2024-01-15")).toBe(false);
  });

  // #2 同じ日の複数配信をまとめる
  it("groups multiple streams on the same JST date", () => {
    const map = groupStreamsByJstDate([
      makeStream("late", "2024-05-02T11:00:00Z"),
      makeStream("early", "2024-05-02T03:00:00Z"),
    ]);
    expect(map.get("2024-05-02")?.map((s) => s.videoId)).toHaveLength(2);
  });

  // #3 同じ日の中は配信開始が早い順
  it("orders same-day streams earliest first", () => {
    const map = groupStreamsByJstDate([
      makeStream("late", "2024-05-02T11:00:00Z"),
      makeStream("early", "2024-05-02T03:00:00Z"),
    ]);
    expect(map.get("2024-05-02")?.map((s) => s.videoId)).toEqual([
      "early",
      "late",
    ]);
  });
});

describe("monthRange", () => {
  // #4 両端を含む昇順の連続した月リスト
  it("lists contiguous months ascending, inclusive of both ends", () => {
    expect(monthRange("2024-01", "2024-04")).toEqual([
      "2024-01",
      "2024-02",
      "2024-03",
      "2024-04",
    ]);
  });

  // #5 配信のない月も範囲内なら含める（‹ › で連続してたどれる）
  it("includes months that have no streams", () => {
    expect(monthRange("2024-11", "2025-02")).toEqual([
      "2024-11",
      "2024-12",
      "2025-01",
      "2025-02",
    ]);
  });

  // #6 同一月なら1件
  it("returns a single month when both ends are the same month", () => {
    expect(monthRange("2024-03", "2024-03")).toEqual(["2024-03"]);
  });
});

describe("buildMonthWeeks", () => {
  // #7 1日の曜日ぶんだけ先頭に空セル（日曜始まり）
  it("pads leading empty cells up to the weekday of the first day", () => {
    // 2024-02-01 は木曜 → 日,月,火,水 の4セルが空
    expect(buildMonthWeeks("2024-02")[0]).toEqual([
      null,
      null,
      null,
      null,
      "2024-02-01",
      "2024-02-02",
      "2024-02-03",
    ]);
  });

  // #8 月の日数ぶんの日付が入る（うるう年）
  it("includes every day of the month in a leap February", () => {
    const days = buildMonthWeeks("2024-02")
      .flat()
      .filter((cell) => cell !== null);
    expect(days).toHaveLength(29);
    expect(days.at(-1)).toBe("2024-02-29");
  });

  // #9 1日が日曜なら空セルなし
  it("adds no leading cells when the first day is a Sunday", () => {
    // 2024-09-01 は日曜
    expect(buildMonthWeeks("2024-09")[0][0]).toBe("2024-09-01");
  });

  // #10 週は7セル区切り
  it("splits the month into weeks of seven cells", () => {
    for (const week of buildMonthWeeks("2024-02")) {
      expect(week.length).toBeLessThanOrEqual(7);
    }
    expect(buildMonthWeeks("2024-02")[1]).toHaveLength(7);
  });
});

describe("calendarMonths / streamsByDate / latestStreamDateInMonth (実データ)", () => {
  // #11 モック配信（2024-01/02/03）の月が昇順で並ぶ
  it("covers the months of the available streams in ascending order", () => {
    expect(calendarMonths).toEqual(["2024-01", "2024-02", "2024-03"]);
  });

  // #12 モック配信がJSTの日付で引ける
  it("indexes the available streams by JST date", () => {
    expect(streamsByDate.get("2024-01-16")?.[0].videoId).toBe("v1");
  });

  // #13 その月の最新配信日（3月は 06 と 21 がある）
  it("returns the most recent stream date of a month", () => {
    expect(latestStreamDateInMonth("2024-03")).toBe("2024-03-21");
  });

  // #14 配信のない月は null
  it("returns null for a month without streams", () => {
    expect(latestStreamDateInMonth("2024-04")).toBeNull();
  });
});
