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

  // ナビに無いページ（曲ページ・プレイリスト）ではどのタブも選択しない（PCの SideNav と揃える）
  it("highlights no tab on pages outside the nav", () => {
    renderWithRoute(<BottomNav />, ["/song/s1"]);
    for (const button of screen.getAllByRole("button")) {
      expect(button.classList.toString()).not.toMatch(/Mui-selected/);
    }
  });
});
