import { describe, it, expect } from "vitest";
import { performanceBadge } from "../performanceStyle";

describe("performanceBadge", () => {
  it("marks the first performance of a song as 初披露", () => {
    expect(performanceBadge({ nth: 1, gapDays: null })).toBe("初披露");
  });

  // 半年（180日）以上空いたら「○か月ぶり」（30日を1か月として切り捨て）
  it("marks a long-awaited performance with the months since the last one", () => {
    expect(performanceBadge({ nth: 3, gapDays: 180 })).toBe("6か月ぶり");
    expect(performanceBadge({ nth: 2, gapDays: 456 })).toBe("15か月ぶり");
  });

  it("adds nothing for a recent repeat", () => {
    expect(performanceBadge({ nth: 2, gapDays: 179 })).toBeNull();
  });

  // 旧CSV（履歴列なし）では何も出さない
  it("adds nothing when the history is unknown", () => {
    expect(performanceBadge({ nth: null, gapDays: null })).toBeNull();
  });
});
