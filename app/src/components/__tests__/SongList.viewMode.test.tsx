import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen, setMatchMedia } from "../../test/helpers";
import SongList from "../songs/SongList";
import { useLayoutStore } from "../../stores/layoutStore";
import { songPerformances } from "../../data/songs";

const songs = songPerformances.slice(0, 1);

function gridColumns(container: HTMLElement): string {
  const grid = container.querySelector("div")!;
  return getComputedStyle(grid).gridTemplateColumns;
}

describe("SongList の表示モード", () => {
  beforeEach(() => {
    setMatchMedia(false);
    useLayoutStore.setState({ songViewMode: null });
  });

  // #1 リストは1列
  it("uses a single column in list mode", () => {
    useLayoutStore.setState({ songViewMode: "list" });
    const { container } = renderWithProviders(<SongList songs={songs} />);
    expect(gridColumns(container)).toBe("1fr");
  });

  // #2 タイルは横並びカードぶんの幅で多列
  it("uses a wide auto-filled track in tile mode", () => {
    useLayoutStore.setState({ songViewMode: "tile" });
    const { container } = renderWithProviders(<SongList songs={songs} />);
    expect(gridColumns(container)).toBe("repeat(auto-fill, minmax(220px, 1fr))");
  });

  // #3 グリッドは縦型カードぶんの狭い幅で多列
  it("uses a narrower auto-filled track in grid mode", () => {
    useLayoutStore.setState({ songViewMode: "grid" });
    const { container } = renderWithProviders(<SongList songs={songs} />);
    expect(gridColumns(container)).toBe("repeat(auto-fill, minmax(160px, 1fr))");
  });

  // #4 グリッドのときだけカードが縦型になる
  it("renders vertical cards only in grid mode", () => {
    useLayoutStore.setState({ songViewMode: "grid" });
    const { container } = renderWithProviders(<SongList songs={songs} />);
    expect(getComputedStyle(container.querySelector("img")!).width).toBe("100%");
  });

  // #5 タイルのカードは横型のまま
  it("renders horizontal cards in tile mode", () => {
    useLayoutStore.setState({ songViewMode: "tile" });
    const { container } = renderWithProviders(<SongList songs={songs} />);
    expect(getComputedStyle(container.querySelector("img")!).width).not.toBe(
      "100%"
    );
  });

  // #6 設定が無ければ画面幅に従う（モバイル=リスト）
  it("falls back to the width-based default", () => {
    const { container } = renderWithProviders(<SongList songs={songs} />);
    expect(gridColumns(container)).toBe("1fr");
  });

  // #7 曲があることは全モードで変わらない
  it("shows the songs regardless of mode", () => {
    useLayoutStore.setState({ songViewMode: "grid" });
    renderWithProviders(<SongList songs={songs} />);
    expect(screen.getByText("天体観測")).toBeInTheDocument();
  });
});
