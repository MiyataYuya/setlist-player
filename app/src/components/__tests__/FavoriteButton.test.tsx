import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../test/helpers";
import FavoriteButton from "../common/FavoriteButton";
import { useLibraryStore } from "../../stores/libraryStore";

describe("FavoriteButton", () => {
  beforeEach(() => {
    useLibraryStore.setState({ favoriteIds: [] });
  });

  // #1 not favorited shows outline
  it("shows outline heart when not favorited", () => {
    renderWithProviders(<FavoriteButton performanceId="p1" />);
    expect(screen.getByTestId("FavoriteBorderIcon")).toBeInTheDocument();
  });

  // #2 favorited shows filled
  it("shows filled heart when favorited", () => {
    useLibraryStore.setState({ favoriteIds: ["p1"] });
    renderWithProviders(<FavoriteButton performanceId="p1" />);
    expect(screen.getByTestId("FavoriteIcon")).toBeInTheDocument();
  });

  // #3 click toggles
  it("calls toggleFavorite on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FavoriteButton performanceId="p1" />);
    await user.click(screen.getByRole("button"));
    expect(useLibraryStore.getState().favoriteIds).toContain("p1");
  });
});
