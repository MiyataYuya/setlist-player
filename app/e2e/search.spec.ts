import { test, expect } from "@playwright/test";
import { closePlayerOverlay, songCards } from "./helpers";

// 5.4 検索して再生
test.describe("検索して再生", () => {
  test("検索バーに入力し、デバウンス後に結果表示、クリックで再生", async ({ page }) => {
    await page.goto("/");

    // 1. 検索タブをクリック
    await page.getByRole("button", { name: "検索" }).click();
    await expect(page).toHaveURL(/\/search/);

    // 2. 検索バーにテキスト入力
    const searchInput = page.getByPlaceholder("曲名・アーティストで検索");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("天体");

    // 3. 300ms のデバウンス後に結果が表示される
    await expect(page.getByText(/\d+ 件/)).toBeVisible({ timeout: 3000 });

    // 4. 件数表示が正しい
    const countText = await page.getByText(/\d+ 件/).textContent();
    const count = parseInt(countText?.match(/(\d+)/)?.[1] ?? "0");
    expect(count).toBeGreaterThan(0);

    // 5. 結果の曲をクリック → 再生開始
    await songCards(page).first().click();

    // 再生画面が開く。閉じると MiniPlayer が表示される
    await closePlayerOverlay(page);
  });
});
