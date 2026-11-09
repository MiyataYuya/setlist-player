import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../test/helpers";
import SearchPage from "../../pages/SearchPage";
import { useLibraryStore } from "../../stores/libraryStore";
import { useHistoryStore } from "../../stores/historyStore";
import { usePlayerStore } from "../../stores/playerStore";
import { testCatalog } from "../../test/catalogFixture";

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

  // #2 未入力時は全曲一覧を出す（ホームから移した一覧）
  it("未入力時に全曲一覧と一覧の操作を表示する", () => {
    renderWithProviders(<SearchPage />);
    expect(
      screen.getByText(`${testCatalog.songPerformances.length} 曲`)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /シャッフル再生/ })).toBeInTheDocument();
    expect(screen.getByTestId("song-list")).toBeInTheDocument();
  });

  // #3 曲/配信を切り替えられる
  it("未入力時に配信チップで配信一覧へ切り替えられる", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchPage />);
    await user.click(screen.getByRole("button", { name: "配信" }));
    expect(
      screen.getByText(`${testCatalog.streams.length} 配信`)
    ).toBeInTheDocument();
    expect(screen.getByTestId("stream-list")).toBeInTheDocument();
  });

  // #4 最近再生した曲はホームにあるので検索では重複させない
  it("履歴があっても「最近再生した曲」を表示しない", () => {
    useHistoryStore.setState({
      history: [{ performanceId: "p1", playedAt: "2024-03-01T00:00:00Z" }],
    });
    renderWithProviders(<SearchPage />);
    expect(screen.queryByText("最近再生した曲")).not.toBeInTheDocument();
  });

  // #5 空白のみの入力は未入力扱い
  it("空白のみの入力では検索結果ではなく全曲一覧を表示する", () => {
    useLibraryStore.setState({ searchQuery: "   " });
    renderWithProviders(<SearchPage />);
    expect(screen.queryByText(/件$/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /シャッフル再生/ })).toBeInTheDocument();
  });

  // #5b 表示方法の切替はページ上部にあり、検索中も使える
  it("表示方法の切替を検索中も表示する", () => {
    useLibraryStore.setState({ searchQuery: "紅蓮華" });
    renderWithProviders(<SearchPage />);
    expect(screen.getByRole("group", { name: "表示方法" })).toBeInTheDocument();
  });

  // #6 入力時は検索結果と件数を表示し、全曲一覧の操作を出さない
  it("入力時は検索結果と件数を表示し、全曲一覧の操作を出さない", () => {
    useLibraryStore.setState({ searchQuery: "紅蓮華" });
    renderWithProviders(<SearchPage />);
    // モックデータには「紅蓮華」の演奏が複数あるため getAllByText を使う
    expect(screen.getAllByText("紅蓮華").length).toBeGreaterThan(0);
    expect(screen.getByText(/件/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /シャッフル再生/ })
    ).not.toBeInTheDocument();
  });

  // #7 入力してヒット0件なら「曲が見つかりません」
  it("ヒット0件なら「曲が見つかりません」を表示する", () => {
    useLibraryStore.setState({ searchQuery: "zzzznotfound" });
    renderWithProviders(<SearchPage />);
    expect(screen.getByText("曲が見つかりません")).toBeInTheDocument();
  });

  // --- 演奏スタイルの絞り込み ---
  const guitarSongs = testCatalog.songPerformances.filter((s) => s.style === "guitar");
  const karaokeSongs = testCatalog.songPerformances.filter((s) => s.style === "karaoke");

  it("全曲一覧を弾き語りだけに絞り込める", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchPage />);
    await user.click(screen.getByRole("button", { name: "弾き語り" }));
    expect(screen.getByText(`${guitarSongs.length} 曲`)).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "歌枠" })).not.toBeInTheDocument();
  });

  it("「すべて」で絞り込みを解除できる", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchPage />);
    await user.click(screen.getByRole("button", { name: "歌枠" }));
    expect(screen.getByText(`${karaokeSongs.length} 曲`)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "すべて" }));
    expect(
      screen.getByText(`${testCatalog.songPerformances.length} 曲`)
    ).toBeInTheDocument();
  });

  it("配信一覧はそのスタイルの曲を含む配信だけに絞る", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchPage />);
    await user.click(screen.getByRole("button", { name: "配信" }));
    await user.click(screen.getByRole("button", { name: "歌枠" }));
    const expected = testCatalog.streams.filter((s) => s.styles.includes("karaoke"));
    expect(screen.getByText(`${expected.length} 配信`)).toBeInTheDocument();
  });

  it("シャッフル再生は絞り込んだスタイルの曲だけを対象にする", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchPage />);
    await user.click(screen.getByRole("button", { name: "歌枠" }));
    await user.click(screen.getByRole("button", { name: /シャッフル再生/ }));
    const { queue } = usePlayerStore.getState();
    expect(queue).toHaveLength(karaokeSongs.length);
    expect(queue.every((s) => s.style === "karaoke")).toBe(true);
  });

  it("検索結果も演奏スタイルで絞り込める", async () => {
    const user = userEvent.setup();
    // 天体観測は p1（弾き語り）と p4（歌枠）の2演奏
    useLibraryStore.setState({ searchQuery: "天体観測" });
    renderWithProviders(<SearchPage />);
    expect(screen.getByText("2 件")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "弾き語り" }));
    expect(screen.getByText("1 件")).toBeInTheDocument();
  });
});
