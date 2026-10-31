import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../test/helpers";
import SortMenu from "../songs/SortMenu";

describe("SortMenu", () => {
  // #1 普段はアイコンボタン1つだけ（一覧は開くまで出さない）
  it("renders a single sort button", () => {
    renderWithProviders(<SortMenu value="date-desc" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /並び替え/ })).toBeInTheDocument();
    expect(screen.queryByText("古い順")).not.toBeInTheDocument();
  });

  // #2 現在の並び順がボタンから分かる
  it("exposes the current order in the button label", () => {
    renderWithProviders(<SortMenu value="artist-asc" onChange={() => {}} />);
    expect(
      screen.getByRole("button", { name: "並び替え: アーティスト A→Z" })
    ).toBeInTheDocument();
  });

  // #3 押すと選択肢が出る
  it("opens the options when clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SortMenu value="date-desc" onChange={() => {}} />);
    await user.click(screen.getByRole("button", { name: /並び替え/ }));
    expect(screen.getByRole("menuitemradio", { name: "古い順" })).toBeInTheDocument();
  });

  // #4 選択中の項目が示される
  it("marks the current option as selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SortMenu value="date-desc" onChange={() => {}} />);
    await user.click(screen.getByRole("button", { name: /並び替え/ }));
    expect(screen.getByRole("menuitemradio", { name: "新しい順" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  // #5 選ぶと通知される
  it("reports the chosen option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<SortMenu value="date-desc" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /並び替え/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "曲名 A→Z" }));
    expect(onChange).toHaveBeenCalledWith("title-asc");
  });

  // #6 選んだらメニューは閉じる
  it("closes the menu after choosing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SortMenu value="date-desc" onChange={() => {}} />);
    await user.click(screen.getByRole("button", { name: /並び替え/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "曲名 A→Z" }));
    expect(screen.queryByRole("menuitemradio", { name: "古い順" })).not.toBeInTheDocument();
  });
});
