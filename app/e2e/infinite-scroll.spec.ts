import { test, expect } from "@playwright/test";

// 5.3 無限スクロール
test.describe("無限スクロール", () => {
  test("スクロールで追加の曲が読み込まれる", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ホーム" })).toBeVisible();

    // 1. 曲一覧を表示（初期状態で曲が50件以上あるか確認）
    const totalCountText = await page.getByText(/\d+ 曲/).first().textContent();
    const totalCount = parseInt(totalCountText?.match(/(\d+)/)?.[1] ?? "0");

    if (totalCount <= 50) {
      // データが50件以下の場合はスキップ
      test.skip();
      return;
    }

    // 初期表示の曲数を数える
    const initialItems = page.locator("ul").first().locator(":scope > li");
    const initialCount = await initialItems.count();
    expect(initialCount).toBeLessThanOrEqual(50);

    // 2. 下にスクロール
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // 3. 追加の曲が読み込まれたことを確認
    const afterScrollCount = await initialItems.count();
    expect(afterScrollCount).toBeGreaterThan(initialCount);
  });
});
