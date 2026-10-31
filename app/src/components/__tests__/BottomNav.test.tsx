import { describe, it, expect } from "vitest";
import { renderWithRoute, screen } from "../../test/helpers";
import BottomNav from "../layout/BottomNav";

describe("BottomNav", () => {
  // #1 4 tabs, カレンダーはホームと検索の間
  it("displays 4 tabs in order: ホーム, カレンダー, 検索, ライブラリ", () => {
    renderWithRoute(<BottomNav />, ["/"]);
    const labels = screen
      .getAllByRole("button")
      .map((tab) => tab.textContent);
    expect(labels).toEqual(["ホーム", "カレンダー", "検索", "ライブラリ"]);
  });

  // #3 active state
  it("highlights current route tab", () => {
    renderWithRoute(<BottomNav />, ["/"]);
    const homeBtn = screen.getByText("ホーム").closest("button");
    expect(homeBtn?.classList.toString()).toMatch(/selected|Mui-selected/);
  });
});
