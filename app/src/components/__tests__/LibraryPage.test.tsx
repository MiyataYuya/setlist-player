import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../test/helpers";
import LocationDisplay from "../../test/LocationDisplay";
import LibraryPage from "../../pages/LibraryPage";
import { useHistoryStore } from "../../stores/historyStore";
import { usePlaylistStore } from "../../stores/playlistStore";
import { useLibraryStore } from "../../stores/libraryStore";

describe("LibraryPage のプレイリスト", () => {
  beforeEach(() => {
    useHistoryStore.setState({ history: [] });
    usePlaylistStore.setState({ playlists: [] });
    useLibraryStore.setState({ favoriteIds: [] });
  });

  // #1 プレイリストが無いとき
  it("shows a message when there are no playlists", () => {
    renderWithProviders(<LibraryPage />);
    expect(screen.getByText("プレイリストがありません")).toBeInTheDocument();
  });

  // #2 名前と曲数
  it("lists each playlist with its name and song count", () => {
    usePlaylistStore.setState({
      playlists: [
        { id: "pl-1", name: "作業BGM", performanceIds: ["p1", "p2"] },
        { id: "pl-2", name: "寝る前", performanceIds: [] },
      ],
    });
    renderWithProviders(<LibraryPage />);
    expect(screen.getByText("作業BGM")).toBeInTheDocument();
    expect(screen.getByText("2曲")).toBeInTheDocument();
    expect(screen.getByText("寝る前")).toBeInTheDocument();
    expect(screen.getByText("0曲")).toBeInTheDocument();
  });

  // #3 見出しに件数
  it("shows the playlist count in the heading", () => {
    usePlaylistStore.setState({
      playlists: [{ id: "pl-1", name: "作業BGM", performanceIds: [] }],
    });
    renderWithProviders(<LibraryPage />);
    expect(screen.getByText("プレイリスト (1)")).toBeInTheDocument();
  });

  // #4 タップで詳細へ
  it("navigates to a playlist when its card is clicked", async () => {
    const user = userEvent.setup();
    usePlaylistStore.setState({
      playlists: [{ id: "pl-1", name: "作業BGM", performanceIds: ["p1"] }],
    });
    renderWithProviders(
      <>
        <LibraryPage />
        <LocationDisplay />
      </>
    );
    await user.click(screen.getByRole("button", { name: /作業BGM/ }));
    expect(screen.getByTestId("pathname")).toHaveTextContent("/playlist/pl-1");
  });
});
