import { describe, it, expect } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../test/helpers";
import LocationDisplay from "../../test/LocationDisplay";
import HomeSection from "../home/HomeSection";

describe("HomeSection", () => {
  // #1 見出しと中身
  it("renders its heading and children", () => {
    renderWithProviders(
      <HomeSection title="最近再生した曲" itemCount={2}>
        <div>タイル</div>
      </HomeSection>
    );
    expect(screen.getByText("最近再生した曲")).toBeInTheDocument();
    expect(screen.getByText("タイル")).toBeInTheDocument();
  });

  // #2 中身が無いセクションは見出しごと出さない
  it("renders nothing when there are no items", () => {
    const { container } = renderWithProviders(
      <HomeSection title="最近再生した曲" itemCount={0}>
        <div>タイル</div>
      </HomeSection>
    );
    expect(container).toBeEmptyDOMElement();
  });

  // #3 サブテキスト（最新の配信のタイトル・日付用）
  it("shows the subtitle when given", () => {
    renderWithProviders(
      <HomeSection title="最新の配信" subtitle="歌枠 ・ 2024/1/16" itemCount={1}>
        <div>タイル</div>
      </HomeSection>
    );
    expect(screen.getByText("歌枠 ・ 2024/1/16")).toBeInTheDocument();
  });

  // #4 溢れているときだけ「すべて表示」を出す
  it("shows a see-all link when there are more items than shown", () => {
    renderWithProviders(
      <HomeSection title="プレイリスト" itemCount={7} shownCount={6} seeAllPath="/library">
        <div>タイル</div>
      </HomeSection>
    );
    expect(screen.getByRole("link", { name: /すべて表示/ })).toBeInTheDocument();
  });

  // #5 全部出ているなら「すべて表示」は出さない
  it("hides the see-all link when everything is shown", () => {
    renderWithProviders(
      <HomeSection title="プレイリスト" itemCount={6} shownCount={6} seeAllPath="/library">
        <div>タイル</div>
      </HomeSection>
    );
    expect(screen.queryByRole("link", { name: /すべて表示/ })).not.toBeInTheDocument();
  });

  // #6 seeAllPath が無ければリンクを出さない（最新の配信は打ち切らないため）
  it("hides the see-all link when no path is given", () => {
    renderWithProviders(
      <HomeSection title="最新の配信" itemCount={9} shownCount={6}>
        <div>タイル</div>
      </HomeSection>
    );
    expect(screen.queryByRole("link", { name: /すべて表示/ })).not.toBeInTheDocument();
  });

  // #6b 見出し名でセクションを特定できる（ホーム上で複数セクションが並ぶため）
  it("exposes itself as a region labelled by its title", () => {
    renderWithProviders(
      <HomeSection title="最新の配信" itemCount={1}>
        <div>タイル</div>
      </HomeSection>
    );
    expect(screen.getByRole("region", { name: "最新の配信" })).toBeInTheDocument();
  });

  // #7 リンクの遷移先
  it("navigates to the given path when the see-all link is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <HomeSection title="プレイリスト" itemCount={7} shownCount={6} seeAllPath="/library">
          <div>タイル</div>
        </HomeSection>
        <LocationDisplay />
      </>
    );
    await user.click(screen.getByRole("link", { name: /すべて表示/ }));
    expect(screen.getByTestId("pathname")).toHaveTextContent("/library");
  });
});
