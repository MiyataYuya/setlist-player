import { describe, it, expect } from "vitest";
import {
  toJstDateKey,
  formatJstDate,
  formatDateKeyLabel,
  formatMonthKeyLabel,
  splitDateKey,
  splitMonthKey,
  toMonthKey,
} from "../jstDate";

describe("toJstDateKey", () => {
  // #1 UTC夜 → JSTでは翌日
  it("returns the next day for a UTC evening timestamp", () => {
    expect(toJstDateKey("2024-01-15T19:00:00Z")).toBe("2024-01-16");
  });

  // #2 UTC朝 → JSTでも同日
  it("returns the same day for a UTC morning timestamp", () => {
    expect(toJstDateKey("2024-01-15T01:00:00Z")).toBe("2024-01-15");
  });

  // #3 年をまたぐ境界
  it("rolls over the year at the JST boundary", () => {
    expect(toJstDateKey("2024-12-31T15:00:00Z")).toBe("2025-01-01");
  });
});

describe("formatJstDate", () => {
  // #4 既存カードと同じ ja-JP 形式、ただしJST固定
  it("formats as ja-JP date in JST", () => {
    expect(formatJstDate("2024-01-15T19:00:00Z")).toBe("2024/1/16");
  });

  // #5 空文字は空文字（既存カードのフォールバック挙動）
  it("returns an empty string for an empty input", () => {
    expect(formatJstDate("")).toBe("");
  });
});

describe("日付キーの分解", () => {
  // #6 `YYYY-MM-DD` を数値3つに
  it("splits a date key into year, month and day", () => {
    expect(splitDateKey("2024-02-09")).toEqual([2024, 2, 9]);
  });

  // #7 `YYYY-MM` を数値2つに
  it("splits a month key into year and month", () => {
    expect(splitMonthKey("2024-11")).toEqual([2024, 11]);
  });

  // #8 日付キーから月キーへ
  it("derives the month key from a date key", () => {
    expect(toMonthKey("2024-02-09")).toBe("2024-02");
  });
});

describe("formatDateKeyLabel", () => {
  // #6 曜日つきの日本語日付
  it("labels a date key with its weekday", () => {
    expect(formatDateKeyLabel("2024-02-11")).toBe("2024年2月11日（日）");
  });

  // #7 曜日の算出が月中でも正しい
  it("computes the weekday for a midmonth date", () => {
    expect(formatDateKeyLabel("2024-03-06")).toBe("2024年3月6日（水）");
  });
});

describe("formatMonthKeyLabel", () => {
  // #8 月キーを日本語表記に（先頭0は落とす）
  it("labels a month key without a leading zero", () => {
    expect(formatMonthKeyLabel("2024-03")).toBe("2024年3月");
  });

  // #9 2桁月
  it("labels a two-digit month", () => {
    expect(formatMonthKeyLabel("2024-11")).toBe("2024年11月");
  });
});
