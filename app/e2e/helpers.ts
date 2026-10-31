import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

/**
 * 曲カード（サムネ付きのボタン）。
 * ホーム上部のセクションにも曲カードが並ぶため、既定で曲一覧にスコープする。
 *
 * `has` に渡すロケータは一致要素からの相対で解決されるので、
 * スコープ側からチェーンせず `page.locator(...)` のまま渡すこと。
 */
export function songCards(page: Page, scope?: Locator): Locator {
  const root = scope ?? page.getByTestId("song-list");
  return root.getByRole("button").filter({ has: page.locator("img") });
}

/**
 * 再生を始めると再生画面が全面に開く（MiniPlayer は isPlayerOpen の間は出ない）。
 * 閉じて MiniPlayer が出るところまで進める。
 */
export async function closePlayerOverlay(page: Page): Promise<Locator> {
  await expect(page.getByTestId("player-close")).toBeVisible();
  await page.getByTestId("player-close").click();
  const miniPlayer = page.getByTestId("mini-player");
  await expect(miniPlayer).toBeVisible();
  return miniPlayer;
}
