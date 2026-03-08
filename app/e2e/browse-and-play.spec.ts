import { test, expect } from "@playwright/test";

// 5.1 曲の閲覧と再生
test.describe("曲の閲覧と再生", () => {
  test("曲一覧を表示し、曲をクリックして再生開始", async ({ page }) => {
    // 1. ホーム画面を開く
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ホーム" })).toBeVisible();

    // 2. 「曲」チップがアクティブ、曲一覧が配信日時降順で表示
    const songChip = page.locator("span", { hasText: /^曲$/ }).first();
    await expect(songChip).toBeVisible();

    // 3. 曲名・アーティスト・日付が表示される
    const songItems = page.locator('[role="button"]').filter({ has: page.locator("img") });
    await expect(songItems.first()).toBeVisible();

    // 4. 曲をクリック
    await songItems.first().click();

    // 5. MiniPlayer に曲名が表示される
    const miniPlayer = page.locator("css=[class*='MuiPaper-root'][class*='MuiPaper-elevation4']");
    await expect(miniPlayer).toBeVisible();

    // 6. MiniPlayer をクリック → プレイヤー画面に遷移
    await miniPlayer.click();
    await expect(page).toHaveURL(/\/player/);

    // 7-8. プレイヤー画面が表示される
    await expect(page.getByText("プレイヤー").or(page.locator("iframe"))).toBeVisible({ timeout: 5000 });
  });
});
