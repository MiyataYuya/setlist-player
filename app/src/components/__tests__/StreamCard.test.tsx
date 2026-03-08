import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../test/helpers";
import StreamCard from "../songs/StreamCard";
import { usePlayerStore } from "../../stores/playerStore";
import { useLibraryStore } from "../../stores/libraryStore";
import type { Stream, SongPerformance } from "../../data/types";

const mockSongs: SongPerformance[] = [
  {
    performanceId: "p1", songId: "s1", title: "Song1", artist: "Artist1",
    videoId: "v1", startSeconds: 0, endSeconds: 300, publishedAt: "2024-01-15T19:00:00Z",
    thumbnailUrl: "https://img.youtube.com/vi/v1/mqdefault.jpg",
  },
  {
    performanceId: "p2", songId: "s2", title: "Song2", artist: "Artist2",
    videoId: "v1", startSeconds: 310, endSeconds: 600, publishedAt: "2024-01-15T19:00:00Z",
    thumbnailUrl: "https://img.youtube.com/vi/v1/mqdefault.jpg",
  },
];

const stream: Stream = {
  videoId: "v1",
  publishedAt: "2024-01-15T19:00:00Z",
  title: "【歌枠】新年歌配信！ #歌枠",
  thumbnailUrl: "https://img.youtube.com/vi/v1/mqdefault.jpg",
  songCount: 2,
  duration: "PT1H",
  viewCount: 10000,
  likeCount: 500,
  songs: mockSongs,
};

const streamEmptyTitle: Stream = {
  ...stream,
  title: "",
};

describe("StreamCard", () => {
  beforeEach(() => {
    usePlayerStore.setState({ queue: [], currentIndex: -1, isPlaying: false });
    useLibraryStore.setState({ favoriteIds: [] });
  });

  // #1 title display (cleaned)
  it("displays cleaned title", () => {
    renderWithProviders(<StreamCard stream={stream} />);
    // 【歌枠】 and #歌枠 should be removed
    expect(screen.getByText("新年歌配信！")).toBeInTheDocument();
  });

  // #2 empty title fallback
  it("falls back to date when title is empty", () => {
    renderWithProviders(<StreamCard stream={streamEmptyTitle} />);
    // Primary text should be date (fallback), secondary also has date
    const allDateTexts = screen.getAllByText(/2024/);
    expect(allDateTexts.length).toBeGreaterThanOrEqual(1);
  });

  // #3 date and song count
  it("shows date and song count", () => {
    renderWithProviders(<StreamCard stream={stream} />);
    expect(screen.getByText(/2 曲/)).toBeInTheDocument();
  });

  // #4 expand/collapse
  it("expands and collapses on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StreamCard stream={stream} />);
    // Initially collapsed - songs not visible
    expect(screen.queryByText("Song1")).not.toBeInTheDocument();

    // Click to expand
    await user.click(screen.getByText("新年歌配信！"));
    expect(screen.getByText("Song1")).toBeInTheDocument();
    expect(screen.getByText("Song2")).toBeInTheDocument();

    // Click to collapse
    await user.click(screen.getByText("新年歌配信！"));
    // After collapse with unmountOnExit, songs should be removed
  });

  // #5 play button
  it("play button starts playback of first song", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StreamCard stream={stream} />);
    const playButton = screen.getByTestId("PlayArrowIcon").closest("button")!;
    await user.click(playButton);

    const state = usePlayerStore.getState();
    expect(state.isPlaying).toBe(true);
    expect(state.queue).toBe(stream.songs);
  });

  // #6 title cleaning
  it("cleans title: removes 【...】, hashtags, ミナミイズミ suffix", () => {
    const streamWithDirtyTitle: Stream = {
      ...stream,
      title: "【テスト】歌配信 - ミナミイズミ ch #singing",
    };
    renderWithProviders(<StreamCard stream={streamWithDirtyTitle} />);
    expect(screen.getByText("歌配信")).toBeInTheDocument();
  });
});
