import { test, expect } from "@playwright/test";

// 配信カレンダーの閲覧
// データは定期的に再生成されるため、具体的な年月日は固定せずパターンで検証する。
test.describe("配信カレンダー", () => {
  test("下部ナビからカレンダーを開き、月を移動して配信日を選ぶ", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ホーム" })).toBeVisible();

    // 1. 下部ナビの「カレンダー」で遷移
    await page.getByRole("button", { name: "カレンダー" }).click();
    await expect(
      page.getByRole("heading", { name: "カレンダー" })
    ).toBeVisible();

    // 2. 最新の配信月が表示され、曜日ヘッダが日曜始まりで並ぶ
    const monthLabel = page.getByText(/^\d{4}年\d{1,2}月$/);
    await expect(monthLabel).toBeVisible();
    await expect(page.getByRole("columnheader").first()).toHaveText("日");

    // 3. 最新月なので「次の月」へは進めない
    await expect(page.getByRole("button", { name: "次の月" })).toBeDisabled();

    // 4. 初期選択された配信日の見出しと配信カードが出る
    await expect(
      page.getByText(/^\d{4}年\d{1,2}月\d{1,2}日（.）$/)
    ).toBeVisible();
    await expect(page.getByText(/\d+ 曲/).first()).toBeVisible();

    // 5. 「前の月」で月が変わる
    const initialMonth = await monthLabel.textContent();
    await page.getByRole("button", { name: "前の月" }).click();
    await expect(monthLabel).not.toHaveText(initialMonth!);

    // 6. 配信がある日をタップするとその日が選択される
    const dayWithStreams = page
      .getByRole("button", { name: /^\d{1,2}月\d{1,2}日・\d+配信$/ })
      .first();
    await dayWithStreams.click();
    await expect(dayWithStreams).toHaveAttribute("aria-current", "date");

    // 7. 選択日の配信カードを展開すると曲が出る
    const streamCard = page
      .getByRole("button")
      .filter({ has: page.locator("img") })
      .first();
    await streamCard.click();
    await expect(
      page.locator('[class*="MuiCollapse-entered"]').first()
    ).toBeVisible({ timeout: 3000 });
  });
});
