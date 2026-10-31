import { describe, it, expect } from "vitest";
import { useLocation } from "react-router-dom";
import { renderWithRoute, screen, userEvent } from "../../test/helpers";
import SideNav from "../layout/SideNav";

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="pathname">{location.pathname}</div>;
}

describe("SideNav", () => {
  it("displays 4 nav items in order: ホーム, カレンダー, 検索, ライブラリ", () => {
    renderWithRoute(<SideNav />, ["/"]);
    const labels = screen.getAllByRole("button").map((item) => item.textContent);
    expect(labels).toEqual(["ホーム", "カレンダー", "検索", "ライブラリ"]);
  });

  it("navigates to /calendar when カレンダー is clicked", async () => {
    const user = userEvent.setup();
    renderWithRoute(
      <>
        <SideNav />
        <LocationDisplay />
      </>,
      ["/"]
    );
    await user.click(screen.getByRole("button", { name: "カレンダー" }));
    expect(screen.getByTestId("pathname")).toHaveTextContent("/calendar");
  });

  it("marks the current route item as selected", () => {
    renderWithRoute(<SideNav />, ["/search"]);
    const searchItem = screen.getByRole("button", { name: "検索" });
    expect(searchItem.className).toMatch(/Mui-selected/);
  });

  it("navigates to the item's route when clicked", async () => {
    const user = userEvent.setup();
    renderWithRoute(
      <>
        <SideNav />
        <LocationDisplay />
      </>,
      ["/"]
    );
    expect(screen.getByTestId("pathname")).toHaveTextContent("/");
    await user.click(screen.getByRole("button", { name: "ライブラリ" }));
    expect(screen.getByTestId("pathname")).toHaveTextContent("/library");
  });
});
