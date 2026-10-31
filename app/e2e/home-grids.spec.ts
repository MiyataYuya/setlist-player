import { test, expect } from "@playwright/test";
import { closePlayerOverlay } from "./helpers";

// ホーム最上部のグリッドセクション
test.describe("ホームのグリッドセクション", () => {
  test("最新の配信が並び、タイルから再生できる", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ホーム" })).toBeVisible();

    // 1. 最新の配信セクションに、その配信の曲タイルが並ぶ
    const latest = page.getByRole("region", { name: "最新の配信" });
    await expect(latest).toBeVisible();
    expect(await latest.getByRole("button").count()).toBeGreaterThan(0);

    // 2. 配信タイトルと日付が添えられる
    //    曲カードにも日付が出るため、DOM先頭＝見出し直下のサブテキストを見る
    //    （サブテキストの厳密な内容は HomePage のユニットテストで固定している）
    await expect(
      latest.getByText(/\d{4}\/\d{1,2}\/\d{1,2}/).first()
    ).toBeVisible();

    // 3. 履歴もプレイリストも無い初回はそのセクションが出ない
    await expect(
      page.getByRole("region", { name: "最近再生した曲" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("region", { name: "プレイリスト" })
    ).toHaveCount(0);

    // 4. タイルをタップすると再生が始まる（モバイルは再生画面が開く）
    await latest.getByRole("button").first().click();

    // 5. 再生画面を閉じるとホームに戻り、最近再生した曲が現れる
    await closePlayerOverlay(page);
    await expect(
      page.getByRole("region", { name: "最近再生した曲" })
    ).toBeVisible();
  });
});
