import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../test/helpers";
import SongCard from "../songs/SongCard";
import { usePlayerStore } from "../../stores/playerStore";
import { useLibraryStore } from "../../stores/libraryStore";
import type { SongPerformance } from "../../data/types";

const song: SongPerformance = {
  performanceId: "p1",
  songId: "s1",
  title: "天体観測",
  artist: "BUMP OF CHICKEN",
  videoId: "v1",
  startSeconds: 0,
  endSeconds: 300,
  publishedAt: "2024-01-15T19:00:00Z",
  thumbnailUrl: "https://img.youtube.com/vi/v1/mqdefault.jpg",
};

const songNoArtist: SongPerformance = {
  ...song,
  performanceId: "p2",
  artist: "",
};

const queue = [song];

describe("SongCard", () => {
  beforeEach(() => {
    usePlayerStore.setState({ queue: [], currentIndex: -1, isPlaying: false });
    useLibraryStore.setState({ favoriteIds: [] });
  });

  // #1 title display
  it("displays song title", () => {
    renderWithProviders(<SongCard song={song} queue={queue} />);
    expect(screen.getByText("天体観測")).toBeInTheDocument();
  });

  // #2 artist + date
  it("displays artist and date", () => {
    renderWithProviders(<SongCard song={song} queue={queue} />);
    expect(screen.getByText(/BUMP OF CHICKEN/)).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  // #3 empty artist
  it("shows only date when artist is empty", () => {
    renderWithProviders(<SongCard song={songNoArtist} queue={queue} />);
    expect(screen.queryByText(/BUMP/)).not.toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  // #4 click plays song
  it("calls playSong on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SongCard song={song} queue={queue} />);
    await user.click(screen.getByText("天体観測"));
    const state = usePlayerStore.getState();
    expect(state.isPlaying).toBe(true);
    expect(state.queue).toBe(queue);
  });

  // #5 menu button present
  it("renders menu button", () => {
    renderWithProviders(<SongCard song={song} queue={queue} />);
    expect(screen.getByTestId("MoreVertIcon")).toBeInTheDocument();
  });
});
