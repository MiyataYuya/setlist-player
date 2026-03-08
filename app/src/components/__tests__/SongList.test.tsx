import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen } from "../../test/helpers";
import SongList from "../songs/SongList";
import { usePlayerStore } from "../../stores/playerStore";
import { useLibraryStore } from "../../stores/libraryStore";
import type { SongPerformance } from "../../data/types";

function makeSongs(count: number): SongPerformance[] {
  return Array.from({ length: count }, (_, i) => ({
    performanceId: `p${i}`,
    songId: `s${i}`,
    title: `Song ${i}`,
    artist: `Artist ${i}`,
    videoId: `v${i}`,
    startSeconds: 0,
    endSeconds: 300,
    publishedAt: "2024-01-01T00:00:00Z",
    thumbnailUrl: `https://img.youtube.com/vi/v${i}/mqdefault.jpg`,
  }));
}

describe("SongList", () => {
  beforeEach(() => {
    usePlayerStore.setState({ queue: [], currentIndex: -1, isPlaying: false });
    useLibraryStore.setState({ favoriteIds: [] });
  });

  // #1 empty
  it('shows "曲が見つかりません" when empty', () => {
    renderWithProviders(<SongList songs={[]} />);
    expect(screen.getByText("曲が見つかりません")).toBeInTheDocument();
  });

  // #2 normal display (infinite scroll, initial 50)
  it("renders up to 50 songs initially with infinite scroll", () => {
    const songs = makeSongs(100);
    renderWithProviders(<SongList songs={songs} />);
    // Should render 50 songs initially
    expect(screen.getByText("Song 0")).toBeInTheDocument();
    expect(screen.getByText("Song 49")).toBeInTheDocument();
    // Song 50 should not be rendered yet
    expect(screen.queryByText("Song 50")).not.toBeInTheDocument();
  });

  // #3 nested=true shows all
  it("renders all songs when nested=true", () => {
    const songs = makeSongs(80);
    renderWithProviders(<SongList songs={songs} nested />);
    expect(screen.getByText("Song 0")).toBeInTheDocument();
    expect(screen.getByText("Song 79")).toBeInTheDocument();
  });
});
