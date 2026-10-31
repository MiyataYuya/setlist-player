import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent, setMatchMedia } from "../../test/helpers";
import ViewModeToggle from "../songs/ViewModeToggle";
import { useLayoutStore } from "../../stores/layoutStore";

describe("ViewModeToggle", () => {
  beforeEach(() => {
    setMatchMedia(true);
    useLayoutStore.setState({ songViewMode: null });
  });

  // #1 3つの選択肢
  it("offers list, tile and grid", () => {
    renderWithProviders(<ViewModeToggle />);
    expect(screen.getByRole("button", { name: "リスト" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "タイル" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "グリッド" })).toBeInTheDocument();
  });

  // #2 未設定でも画面幅に応じた既定が選択表示される（PC=タイル）
  it("marks the width-based default as selected when nothing is stored", () => {
    renderWithProviders(<ViewModeToggle />);
    expect(screen.getByRole("button", { name: "タイル" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  // #3 押すと保存される
  it("stores the chosen mode", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ViewModeToggle />);
    await user.click(screen.getByRole("button", { name: "グリッド" }));
    expect(useLayoutStore.getState().songViewMode).toBe("grid");
  });

  // #4 保存済みの設定が選択表示される
  it("marks the stored mode as selected", () => {
    useLayoutStore.setState({ songViewMode: "list" });
    renderWithProviders(<ViewModeToggle />);
    expect(screen.getByRole("button", { name: "リスト" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  // #5 選択中をもう一度押しても解除されない（モードは常にどれか1つ）
  it("keeps a mode selected when the active one is clicked again", async () => {
    const user = userEvent.setup();
    useLayoutStore.setState({ songViewMode: "tile" });
    renderWithProviders(<ViewModeToggle />);
    await user.click(screen.getByRole("button", { name: "タイル" }));
    expect(useLayoutStore.getState().songViewMode).toBe("tile");
  });
});
