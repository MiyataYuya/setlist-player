import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen } from "../../test/helpers";
import PlayerBody from "../player/PlayerBody";
import { usePlayerStore } from "../../stores/playerStore";
import { songPerformances } from "../../data/songs";

const sample = songPerformances[0];

describe("PlayerBody", () => {
  beforeEach(() => {
    // jsdom は scrollIntoView を実装していないためスタブする
    Element.prototype.scrollIntoView = () => {};
    usePlayerStore.getState().playSong(sample, [sample]);
  });

  it("renders the current song title", () => {
    renderWithProviders(<PlayerBody variant="overlay" />);
    // タイトルは曲情報ヘッダ(h6)とキュー項目の両方に出るため、見出しを特定して検証する
    expect(
      screen.getByRole("heading", { name: sample.title }),
    ).toBeInTheDocument();
  });

  it("shows a close button in overlay variant", () => {
    renderWithProviders(<PlayerBody variant="overlay" />);
    expect(screen.getByTestId("player-close")).toBeInTheDocument();
  });

  it("does not show a close button in panel variant", () => {
    renderWithProviders(<PlayerBody variant="panel" />);
    expect(screen.queryByTestId("player-close")).not.toBeInTheDocument();
  });
});
