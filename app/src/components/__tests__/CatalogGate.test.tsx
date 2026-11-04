import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../test/helpers";
import CatalogGate from "../layout/CatalogGate";
import { useCatalogStore } from "../../stores/catalogStore";

function renderGate() {
  return renderWithProviders(
    <CatalogGate>
      <p>曲一覧</p>
    </CatalogGate>
  );
}

describe("CatalogGate", () => {
  // #1 未開始なら1回だけ読み込みを始め、読み込み中を表示
  it("starts loading once when idle and shows a progress indicator", () => {
    const load = vi.fn(async () => {});
    useCatalogStore.setState({ status: "idle", catalog: null, error: null, load });
    renderGate();
    expect(load).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("曲一覧")).toBeNull();
  });

  // #2 読み込み中は重ねて load しない
  it("does not start another load while loading", () => {
    const load = vi.fn(async () => {});
    useCatalogStore.setState({ status: "loading", catalog: null, error: null, load });
    renderGate();
    expect(load).not.toHaveBeenCalled();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  // #3 失敗時はメッセージと再試行
  it("shows an error with a retry button that reloads", async () => {
    const load = vi.fn(async () => {});
    useCatalogStore.setState({ status: "error", catalog: null, error: new Error("x"), load });
    renderGate();
    expect(screen.getByText("曲データを読み込めませんでした")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(load).toHaveBeenCalledTimes(1);
  });

  // #4 読み込み完了で子を描画
  it("renders children when ready", () => {
    renderGate(); // setup.ts で ready(testCatalog)
    expect(screen.getByText("曲一覧")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
