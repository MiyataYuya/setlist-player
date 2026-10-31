import { test, expect } from "@playwright/test";

// 5.5 お気に入り操作
test.describe("お気に入り操作", () => {
  test("お気に入り追加・ライブラリ確認・解除", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ホーム" })).toBeVisible();

    // 1. 曲カードの ⋮ メニューからお気に入りに追加する
    const songList = page.getByTestId("song-list");
    await songList.getByTestId("MoreVertIcon").first().click();
    await page.getByRole("menuitem", { name: "お気に入り" }).click();

    // 2. ライブラリタブに遷移
    await page.getByRole("button", { name: "ライブラリ" }).click();
    await expect(page).toHaveURL(/\/library$/);

    // 3. お気に入り曲が表示される
    await expect(page.getByText("お気に入り (1)")).toBeVisible();

    // 4. ⋮ メニューから再度押して解除
    //    ライブラリは「再生履歴」「お気に入り」の2つのリストを持つので後者を指す
    const favorites = page.getByTestId("song-list").last();
    await favorites.getByTestId("MoreVertIcon").first().click();
    await page.getByRole("menuitem", { name: "お気に入り" }).click();

    // 5. 「お気に入りに追加された曲がありません」表示を確認
    await expect(
      page.getByText("お気に入りに追加された曲がありません")
    ).toBeVisible();
  });
});
