import { test, expect } from "@playwright/test";
import { closePlayerOverlay, songCards, openSearchPage } from "./helpers";

// 5.1 曲の閲覧と再生
test.describe("曲の閲覧と再生", () => {
  test("曲一覧を表示し、曲をクリックして再生開始", async ({ page }) => {
    // 1. 全曲一覧のある検索画面を開く
    await openSearchPage(page);

    // 2. 「曲」チップがアクティブ、曲一覧が配信日時降順で表示
    const songChip = page.locator("span", { hasText: /^曲$/ }).first();
    await expect(songChip).toBeVisible();

    // 3. 曲名・アーティスト・日付が表示される
    const songItems = songCards(page);
    await expect(songItems.first()).toBeVisible();

    // 4. 曲をクリック → 再生画面がそのまま開く
    await songItems.first().click();

    // 5. 再生画面を閉じると MiniPlayer が出る
    const miniPlayer = await closePlayerOverlay(page);

    // 6. MiniPlayer をクリック → 再生画面に戻る
    await miniPlayer.click();
    await expect(page.getByTestId("player-close")).toBeVisible();
    await expect(miniPlayer).toBeHidden();
  });
});
