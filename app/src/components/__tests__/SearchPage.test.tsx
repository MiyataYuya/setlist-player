import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen } from "../../test/helpers";
import SearchPage from "../../pages/SearchPage";
import { useLibraryStore } from "../../stores/libraryStore";
import { useHistoryStore } from "../../stores/historyStore";
import { usePlayerStore } from "../../stores/playerStore";

describe("SearchPage", () => {
  beforeEach(() => {
    useLibraryStore.setState({ searchQuery: "", favoriteIds: [] });
    useHistoryStore.setState({ history: [] });
    usePlayerStore.setState({ queue: [], currentIndex: -1, isPlaying: false });
  });

  // #1 未入力時は「曲が見つかりません」を出さない
  it("未入力時に「曲が見つかりません」を表示しない", () => {
    renderWithProviders(<SearchPage />);
    expect(screen.queryByText("曲が見つかりません")).not.toBeInTheDocument();
  });

  // #2 未入力時は誘導文を表示
  it("未入力時に誘導文を表示する", () => {
    renderWithProviders(<SearchPage />);
    expect(screen.getByText("曲名やアーティスト名で検索")).toBeInTheDocument();
  });

  // #3 履歴があれば「最近再生した曲」を表示
  it("履歴があれば「最近再生した曲」と曲を表示する", () => {
    useHistoryStore.setState({
      history: [{ performanceId: "p1", playedAt: "2024-03-01T00:00:00Z" }],
    });
    renderWithProviders(<SearchPage />);
    expect(screen.getByText("最近再生した曲")).toBeInTheDocument();
    expect(screen.getByText("天体観測")).toBeInTheDocument();
  });

  // #4 履歴がなければ「最近再生した曲」見出しを出さない
  it("履歴がなければ「最近再生した曲」を表示しない", () => {
    renderWithProviders(<SearchPage />);
    expect(screen.queryByText("最近再生した曲")).not.toBeInTheDocument();
  });

  // #5 空白のみの入力は未入力扱い
  it("空白のみの入力では全曲表示せず誘導文を表示する", () => {
    useLibraryStore.setState({ searchQuery: "   " });
    renderWithProviders(<SearchPage />);
    expect(screen.getByText("曲名やアーティスト名で検索")).toBeInTheDocument();
    expect(screen.queryByText(/件$/)).not.toBeInTheDocument();
  });

  // #6 入力時は検索結果と件数を表示し、誘導文を出さない
  it("入力時は検索結果と件数を表示し、誘導文を出さない", () => {
    useLibraryStore.setState({ searchQuery: "紅蓮華" });
    renderWithProviders(<SearchPage />);
    // モックデータには「紅蓮華」の演奏が複数あるため getAllByText を使う
    expect(screen.getAllByText("紅蓮華").length).toBeGreaterThan(0);
    expect(screen.getByText(/件/)).toBeInTheDocument();
    expect(screen.queryByText("曲名やアーティスト名で検索")).not.toBeInTheDocument();
  });

  // #7 入力してヒット0件なら「曲が見つかりません」
  it("ヒット0件なら「曲が見つかりません」を表示する", () => {
    useLibraryStore.setState({ searchQuery: "zzzznotfound" });
    renderWithProviders(<SearchPage />);
    expect(screen.getByText("曲が見つかりません")).toBeInTheDocument();
  });
});
