import { describe, it, expect } from "vitest";
import { renderWithRoute, screen } from "../../test/helpers";
import BottomNav from "../layout/BottomNav";

describe("BottomNav", () => {
  // #1 3 tabs
  it("displays 3 tabs: ホーム, 検索, ライブラリ", () => {
    renderWithRoute(<BottomNav />, ["/"]);
    expect(screen.getByText("ホーム")).toBeInTheDocument();
    expect(screen.getByText("検索")).toBeInTheDocument();
    expect(screen.getByText("ライブラリ")).toBeInTheDocument();
  });

  // #3 active state
  it("highlights current route tab", () => {
    renderWithRoute(<BottomNav />, ["/"]);
    const homeBtn = screen.getByText("ホーム").closest("button");
    expect(homeBtn?.classList.toString()).toMatch(/selected|Mui-selected/);
  });
});
