import { test, expect } from "@playwright/test";
import { openSearchPage, songCards } from "./helpers";

// 曲ページ（同じ曲の歌唱一覧）
test.describe("曲ページ", () => {
  test("曲カードの ⋮ から開き、歌唱回数と歌唱一覧が出る", async ({ page }) => {
    await openSearchPage(page);

    const firstTitle = await songCards(page).first().locator("p").first().textContent();
    await page.getByTestId("song-list").getByTestId("MoreVertIcon").first().click();
    await page.getByRole("menuitem", { name: "この曲の歌唱一覧" }).click();

    await expect(page).toHaveURL(/\/song\/song_\d+$/);
    await expect(page.getByRole("heading", { name: firstTitle! })).toBeVisible();
    await expect(page.getByText(/^\d+回/)).toBeVisible();
    expect(await songCards(page).count()).toBeGreaterThan(0);

    // 曲ページで再生 → 曲名を押すと（同じページなので）再生画面が閉じるだけ
    await page.getByRole("button", { name: /すべて再生/ }).click();
    await page.getByRole("link", { name: firstTitle! }).click();
    await expect(page.getByTestId("mini-player")).toBeVisible();

    // 戻ると検索へ（同じ曲ページが履歴に重なっていない）
    await page.goBack();
    await expect(page.getByRole("heading", { name: "検索" })).toBeVisible();
  });

  test("再生画面の曲名から曲ページへ移り、戻ると元の画面", async ({ page }) => {
    await openSearchPage(page);

    // 曲を再生 → 再生画面（全面表示）の曲名を押す
    const firstTitle = await songCards(page).first().locator("p").first().textContent();
    await songCards(page).first().click();
    await page.getByRole("link", { name: firstTitle! }).click();

    // 再生画面が閉じて曲ページが見える
    await expect(page).toHaveURL(/\/song\/song_\d+$/);
    await expect(page.getByRole("heading", { name: firstTitle! })).toBeVisible();
    await expect(page.getByTestId("mini-player")).toBeVisible();

    // 戻ると1回で検索へ（再生画面のために積んだ履歴が残っていない）
    await page.goBack();
    await expect(page.getByRole("heading", { name: "検索" })).toBeVisible();
  });
});
