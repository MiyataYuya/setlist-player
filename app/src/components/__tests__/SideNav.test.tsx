import { describe, it, expect } from "vitest";
import { renderWithRoute, screen, userEvent } from "../../test/helpers";
import SideNav from "../layout/SideNav";

describe("SideNav", () => {
  it("displays 3 nav items: ホーム, 検索, ライブラリ", () => {
    renderWithRoute(<SideNav />, ["/"]);
    expect(screen.getByText("ホーム")).toBeInTheDocument();
    expect(screen.getByText("検索")).toBeInTheDocument();
    expect(screen.getByText("ライブラリ")).toBeInTheDocument();
  });

  it("marks the current route item as selected", () => {
    renderWithRoute(<SideNav />, ["/search"]);
    const searchItem = screen.getByRole("button", { name: "検索" });
    expect(searchItem.className).toMatch(/Mui-selected/);
  });

  it("navigates when an item is clicked", async () => {
    const user = userEvent.setup();
    renderWithRoute(<SideNav />, ["/"]);
    await user.click(screen.getByText("ライブラリ"));
    const libItem = screen.getByRole("button", { name: "ライブラリ" });
    expect(libItem.className).toMatch(/Mui-selected/);
  });
});
