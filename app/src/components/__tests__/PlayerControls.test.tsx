import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../test/helpers";
import PlayerControls from "../player/PlayerControls";
import { usePlayerStore } from "../../stores/playerStore";
import type { SongPerformance } from "../../data/types";

const song: SongPerformance = {
  performanceId: "p1", songId: "s1", title: "Test", artist: "Test",
  videoId: "v1", startSeconds: 0, endSeconds: 300, publishedAt: "2024-01-01T00:00:00Z",
  thumbnailUrl: "https://img.youtube.com/vi/v1/mqdefault.jpg",
};

describe("PlayerControls", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      queue: [song],
      currentIndex: 0,
      isPlaying: false,
      isShuffle: false,
      isRepeat: false,
    });
  });

  // #1 play/pause
  it("togglePlay on play button click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlayerControls />);
    const playBtn = screen.getByTestId("PlayArrowIcon").closest("button")!;
    await user.click(playBtn);
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  // #2 next/prev
  it("playNext on next button click", async () => {
    usePlayerStore.setState({ queue: [song, { ...song, performanceId: "p2" }], currentIndex: 0 });
    const user = userEvent.setup();
    renderWithProviders(<PlayerControls />);
    const nextBtn = screen.getByTestId("SkipNextIcon").closest("button")!;
    await user.click(nextBtn);
    expect(usePlayerStore.getState().currentIndex).toBe(1);
  });

  it("playPrev on prev button click", async () => {
    usePlayerStore.setState({ queue: [song, { ...song, performanceId: "p2" }], currentIndex: 1 });
    const user = userEvent.setup();
    renderWithProviders(<PlayerControls />);
    const prevBtn = screen.getByTestId("SkipPreviousIcon").closest("button")!;
    await user.click(prevBtn);
    expect(usePlayerStore.getState().currentIndex).toBe(0);
  });

  // #3 shuffle
  it("toggleShuffle on shuffle button click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlayerControls />);
    const shuffleBtn = screen.getByTestId("ShuffleIcon").closest("button")!;
    await user.click(shuffleBtn);
    expect(usePlayerStore.getState().isShuffle).toBe(true);
  });

  // #4 repeat
  it("toggleRepeat on repeat button click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlayerControls />);
    const repeatBtn = screen.getByTestId("RepeatIcon").closest("button")!;
    await user.click(repeatBtn);
    expect(usePlayerStore.getState().isRepeat).toBe(true);
  });
});
