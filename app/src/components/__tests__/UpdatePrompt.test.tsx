import { describe, it, expect, vi } from "vitest";
import type { Dispatch, SetStateAction } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { renderWithProviders, screen, userEvent } from "../../test/helpers";
import UpdatePrompt from "../layout/UpdatePrompt";

const noop: Dispatch<SetStateAction<boolean>> = () => {};

function mockRegisterSW(needRefresh: boolean) {
  const updateServiceWorker = vi.fn(async () => {});
  vi.mocked(useRegisterSW).mockReturnValue({
    needRefresh: [needRefresh, noop],
    offlineReady: [false, noop],
    updateServiceWorker,
  });
  return updateServiceWorker;
}

describe("UpdatePrompt", () => {
  // #1 新しい版が無ければ何も出さない
  it("shows nothing when no update is waiting", () => {
    mockRegisterSW(false);
    renderWithProviders(<UpdatePrompt />);
    expect(screen.queryByText("新しいバージョンがあります")).toBeNull();
  });

  // #2 待機中の新しい版があれば知らせる
  it("announces a waiting update", () => {
    mockRegisterSW(true);
    renderWithProviders(<UpdatePrompt />);
    expect(screen.getByText("新しいバージョンがあります")).toBeInTheDocument();
  });

  // #3 「更新」で新しい版に切り替えて再読み込み
  it("applies the update and reloads when 更新 is pressed", async () => {
    const updateServiceWorker = mockRegisterSW(true);
    renderWithProviders(<UpdatePrompt />);
    await userEvent.click(screen.getByRole("button", { name: "更新" }));
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });
});
