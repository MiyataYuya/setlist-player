import { test, expect } from "@playwright/test";

// 5.5 お気に入り操作
test.describe("お気に入り操作", () => {
  test("お気に入り追加・ライブラリ確認・解除", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ホーム" })).toBeVisible();

    // 1. ホーム画面で曲のハートボタンをクリック
    const heartButton = page.locator('[data-testid="FavoriteBorderIcon"]').first();
    await expect(heartButton).toBeVisible();
    await heartButton.click();

    // お気に入りアイコンが塗りつぶしに変わる
    await expect(page.locator('[data-testid="FavoriteIcon"]').first()).toBeVisible();

    // 2. ライブラリタブに遷移
    await page.getByRole("button", { name: "ライブラリ" }).click();
    await expect(page).toHaveURL(/\/library/);

    // 3. お気に入り曲が表示される
    await expect(page.getByText(/お気に入り: \d+ 曲/)).toBeVisible();
    const songItems = page.locator('[role="button"]').filter({ has: page.locator("img") });
    await expect(songItems.first()).toBeVisible();

    // 4. ハートボタンを再クリック → お気に入り解除
    const filledHeart = page.locator('[data-testid="FavoriteIcon"]').first();
    await filledHeart.click();

    // 5. 「お気に入りに追加された曲がありません」表示を確認
    await expect(page.getByText("お気に入りに追加された曲がありません")).toBeVisible();
  });
});
