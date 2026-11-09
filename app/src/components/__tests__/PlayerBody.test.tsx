import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, renderWithRoute, screen, userEvent } from "../../test/helpers";
import LocationDisplay from "../../test/LocationDisplay";
import PlayerBody from "../player/PlayerBody";
import { usePlayerStore } from "../../stores/playerStore";
import { testCatalog } from "../../test/catalogFixture";

const sample = testCatalog.songPerformances[0];

describe("PlayerBody", () => {
  beforeEach(() => {
    usePlayerStore.getState().playSong(sample, [sample]);
  });

  it("renders the current song title", () => {
    renderWithProviders(<PlayerBody variant="overlay" />);
    // タイトルは曲情報ヘッダ(h6)とキュー項目の両方に出るため、見出しを特定して検証する
    expect(
      screen.getByRole("heading", { name: sample.title }),
    ).toBeInTheDocument();
  });

  // 日付は閲覧者のタイムゾーンではなくJSTで表示する（19:00Z は JST では翌日）
  it("shows the published date in JST", () => {
    renderWithProviders(<PlayerBody variant="overlay" />);
    expect(screen.getByText(/2024\/1\/16/)).toBeInTheDocument();
  });

  it("shows a close button in overlay variant", () => {
    renderWithProviders(<PlayerBody variant="overlay" />);
    expect(screen.getByTestId("player-close")).toBeInTheDocument();
  });

  it("does not show a close button in panel variant", () => {
    renderWithProviders(<PlayerBody variant="panel" />);
    expect(screen.queryByTestId("player-close")).not.toBeInTheDocument();
  });

  it("calls window.history.back when the close button is clicked", async () => {
    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithProviders(<PlayerBody variant="overlay" />);
    await user.click(screen.getByTestId("player-close"));
    expect(backSpy).toHaveBeenCalledOnce();
    backSpy.mockRestore();
  });

  // 曲名から曲ページへ。モバイルの全面表示は閉じて遷移先を見せる
  it("opens the song page from the title and closes the overlay", async () => {
    const user = userEvent.setup();
    usePlayerStore.setState({ isPlayerOpen: true });
    renderWithProviders(
      <>
        <PlayerBody variant="overlay" />
        <LocationDisplay />
      </>
    );
    await user.click(screen.getByRole("link", { name: sample.title }));
    expect(screen.getByTestId("pathname")).toHaveTextContent(`/song/${sample.songId}`);
    expect(usePlayerStore.getState().isPlayerOpen).toBe(false);
  });

  // すでにその曲ページにいるなら遷移せず、閉じるボタンと同じく履歴を戻して閉じる
  // （同じページへの遷移を履歴に積まない）
  it("just closes the overlay when already on that song page", async () => {
    const user = userEvent.setup();
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    usePlayerStore.setState({ isPlayerOpen: true });
    renderWithRoute(
      <>
        <PlayerBody variant="overlay" />
        <LocationDisplay />
      </>,
      [`/song/${sample.songId}`]
    );
    await user.click(screen.getByRole("link", { name: sample.title }));
    expect(back).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("pathname")).toHaveTextContent(`/song/${sample.songId}`);
    back.mockRestore();
  });
});
