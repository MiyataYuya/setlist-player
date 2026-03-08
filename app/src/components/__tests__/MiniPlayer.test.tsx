import { describe, it, expect, beforeEach } from "vitest";
import { renderWithRoute, screen, userEvent } from "../../test/helpers";
import MiniPlayer from "../layout/MiniPlayer";
import { usePlayerStore } from "../../stores/playerStore";
import type { SongPerformance } from "../../data/types";

const song: SongPerformance = {
  performanceId: "p1", songId: "s1", title: "天体観測", artist: "BUMP OF CHICKEN",
  videoId: "v1", startSeconds: 0, endSeconds: 300, publishedAt: "2024-01-01T00:00:00Z",
  thumbnailUrl: "https://img.youtube.com/vi/v1/mqdefault.jpg",
};

describe("MiniPlayer", () => {
  beforeEach(() => {
    usePlayerStore.setState({ queue: [], currentIndex: -1, isPlaying: false });
  });

  // #1 no song selected
  it("renders nothing when no song selected", () => {
    const { container } = renderWithRoute(<MiniPlayer />, ["/"]);
    expect(container.firstChild).toBeNull();
  });

  // #2 hidden on /player
  it("renders nothing on /player page", () => {
    usePlayerStore.setState({ queue: [song], currentIndex: 0, isPlaying: true });
    const { container } = renderWithRoute(<MiniPlayer />, ["/player"]);
    expect(container.firstChild).toBeNull();
  });

  // #3 shows song info
  it("shows song title and artist when playing", () => {
    usePlayerStore.setState({ queue: [song], currentIndex: 0, isPlaying: true });
    renderWithRoute(<MiniPlayer />, ["/"]);
    expect(screen.getByText("天体観測")).toBeInTheDocument();
    expect(screen.getByText("BUMP OF CHICKEN")).toBeInTheDocument();
  });

  // #4 pause icon when playing
  it("shows pause icon when isPlaying", () => {
    usePlayerStore.setState({ queue: [song], currentIndex: 0, isPlaying: true });
    renderWithRoute(<MiniPlayer />, ["/"]);
    expect(screen.getByTestId("PauseIcon")).toBeInTheDocument();
  });

  // #5 play icon when paused
  it("shows play icon when paused", () => {
    usePlayerStore.setState({ queue: [song], currentIndex: 0, isPlaying: false });
    renderWithRoute(<MiniPlayer />, ["/"]);
    expect(screen.getByTestId("PlayArrowIcon")).toBeInTheDocument();
  });

  // #6 togglePlay
  it("togglePlay on play/pause button click", async () => {
    usePlayerStore.setState({ queue: [song], currentIndex: 0, isPlaying: false });
    const user = userEvent.setup();
    renderWithRoute(<MiniPlayer />, ["/"]);
    const btn = screen.getByTestId("PlayArrowIcon").closest("button")!;
    await user.click(btn);
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  // #7 playNext
  it("playNext on skip button click", async () => {
    const song2 = { ...song, performanceId: "p2" };
    usePlayerStore.setState({ queue: [song, song2], currentIndex: 0, isPlaying: true });
    const user = userEvent.setup();
    renderWithRoute(<MiniPlayer />, ["/"]);
    const btn = screen.getByTestId("SkipNextIcon").closest("button")!;
    await user.click(btn);
    expect(usePlayerStore.getState().currentIndex).toBe(1);
  });
});
