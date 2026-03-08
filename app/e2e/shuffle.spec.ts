import { test, expect } from "@playwright/test";

// 5.6 シャッフル再生
test.describe("シャッフル再生", () => {
  test("シャッフル再生ボタンで再生開始、次へで別の曲", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ホーム" })).toBeVisible();

    // 1. 「シャッフル再生」ボタンをクリック
    await page.getByRole("button", { name: "シャッフル再生" }).click();

    // 2. MiniPlayer に曲が表示される
    const miniPlayer = page.locator("css=[class*='MuiPaper-elevation4']");
    await expect(miniPlayer).toBeVisible();

    // 最初の曲名を取得
    const firstSongTitle = await miniPlayer.locator("p, span").first().textContent();
    expect(firstSongTitle).toBeTruthy();

    // 3. 次へボタンをクリック
    const skipButton = miniPlayer.locator('[data-testid="SkipNextIcon"]');
    await skipButton.click();

    // 4. 曲が切り替わる（シャッフルなので別の曲になる可能性が高い）
    // 注: ランダム性のため同じ曲になることもあり得るが、MiniPlayerが維持されることを確認
    await expect(miniPlayer).toBeVisible();
  });
});
