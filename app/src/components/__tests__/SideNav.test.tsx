import { describe, it, expect } from "vitest";
import { useLocation } from "react-router-dom";
import { renderWithRoute, screen, userEvent } from "../../test/helpers";
import SideNav from "../layout/SideNav";

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="pathname">{location.pathname}</div>;
}

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
