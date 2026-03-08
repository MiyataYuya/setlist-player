import { test, expect } from "@playwright/test";

// 5.7 画面遷移と再生維持
test.describe("画面遷移と再生維持", () => {
  test("再生中にページ遷移してもMiniPlayerが維持される", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ホーム" })).toBeVisible();

    // 1. ホーム画面で曲をクリック → 再生開始
    const songItem = page.locator('[role="button"]').filter({ has: page.locator("img") }).first();
    await songItem.click();

    const miniPlayer = page.locator("css=[class*='MuiPaper-elevation4']");
    await expect(miniPlayer).toBeVisible();

    // 曲名を記録
    const songTitle = await miniPlayer.locator("p, span").first().textContent();

    // 2. ホーム → 検索 (BottomNavのボタンを使う)
    await page.getByRole("button", { name: "検索" }).click();
    await expect(page).toHaveURL(/\/search/);

    // 3. MiniPlayer が維持される
    await expect(miniPlayer).toBeVisible();
    await expect(miniPlayer.getByText(songTitle!)).toBeVisible();

    // 検索ページが正しく表示
    await expect(page.getByPlaceholder("曲名・アーティストで検索")).toBeVisible();

    // 検索 → ライブラリ
    await page.getByRole("button", { name: "ライブラリ" }).click();
    await expect(page).toHaveURL(/\/library/);
    await expect(miniPlayer).toBeVisible();

    // ライブラリ → ホーム
    await page.getByRole("button", { name: "ホーム" }).click();
    await expect(page).toHaveURL("/");
    await expect(miniPlayer).toBeVisible();

    // 4. MiniPlayerクリック → /player
    await miniPlayer.click();
    await expect(page).toHaveURL(/\/player/);

    // 5. /player 画面では MiniPlayer が非表示
    await expect(miniPlayer).not.toBeVisible();
  });
});
