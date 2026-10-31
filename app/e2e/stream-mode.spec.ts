import { test, expect } from "@playwright/test";
import { closePlayerOverlay } from "./helpers";

// 5.2 配信モードの閲覧と再生
test.describe("配信モードの閲覧と再生", () => {
  test("配信チップで切り替え、配信カード操作", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ホーム" })).toBeVisible();

    // 1. 「配信」チップをクリック
    const streamChip = page.getByRole("button", { name: "配信", exact: true }).first();
    await streamChip.click();

    // 2. "N 配信" のカウントに切り替わる
    await expect(page.getByText(/\d+ 配信/)).toBeVisible();

    // 3. 配信タイトル・日付・曲数が表示される
    await expect(page.getByText(/\d+ 曲/).first()).toBeVisible();

    // 4. 配信カードをクリック → 曲一覧が展開
    // ホーム上部のセクションにも曲カードがあるため、配信一覧の中に限定する
    const streamCard = page
      .getByTestId("stream-list")
      .getByRole("button")
      .filter({ has: page.locator("img") })
      .first();
    await streamCard.click();

    // 展開後に曲リストが表示される
    await expect(page.locator('[class*="MuiCollapse-entered"]').or(
      page.locator('[style*="height: auto"]')
    ).first()).toBeVisible({ timeout: 3000 });

    // 5. 展開内の曲をクリック → 再生開始
    // 展開された曲リスト内の最初の曲をクリック
    const expandedSongs = page.locator('[class*="MuiCollapse"]').getByRole("button").filter({ has: page.locator("img") });
    if (await expandedSongs.count() > 0) {
      await expandedSongs.first().click();
      // 再生画面が開く。閉じると MiniPlayer が表示される
      await closePlayerOverlay(page);
    }

    // 7. 再度クリック → 折りたたみ
    await streamCard.click();
  });

  test("▶ボタンで配信再生", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ホーム" })).toBeVisible();

    // 配信モードに切替
    const streamChip = page.locator("span", { hasText: /^配信$/ }).first();
    await streamChip.click();
    await expect(page.getByText(/\d+ 配信/)).toBeVisible();

    // 6. ▶ボタンをクリック → 配信の最初の曲から再生開始
    const playButton = page
      .getByTestId("stream-list")
      .locator('[data-testid="PlayArrowIcon"]')
      .first();
    await playButton.click();

    // 再生画面が開く。閉じると MiniPlayer が表示される
    await closePlayerOverlay(page);
  });
});
