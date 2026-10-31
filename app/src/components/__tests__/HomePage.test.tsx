import { describe, it, expect, beforeEach } from "vitest";
import { within } from "@testing-library/react";
import { renderWithProviders, screen } from "../../test/helpers";
import HomePage from "../../pages/HomePage";
import { usePlayerStore } from "../../stores/playerStore";
import { useHistoryStore } from "../../stores/historyStore";
import { usePlaylistStore } from "../../stores/playlistStore";
import { streams, songPerformances } from "../../data/songs";

// モックの最新配信は v5（2024-03-20T19:00:00Z → JST 2024/3/21、曲は "Lemon" 1曲）
const latestStream = streams[0];

function section(name: string) {
  return within(screen.getByRole("region", { name }));
}

describe("HomePage のグリッドセクション", () => {
  beforeEach(() => {
    usePlayerStore.setState({ queue: [], currentIndex: -1, isPlaying: false });
    useHistoryStore.setState({ history: [] });
    usePlaylistStore.setState({ playlists: [] });
  });

  // #1 最新の配信は常に出る（データがある限り）
  it("shows the latest stream's songs", () => {
    renderWithProviders(<HomePage />);
    const latest = section("最新の配信");
    for (const song of latestStream.songs) {
      expect(latest.getByText(song.title)).toBeInTheDocument();
    }
  });

  // #2 最新配信は打ち切らず全曲出す
  it("does not cap the latest stream's songs", () => {
    renderWithProviders(<HomePage />);
    expect(
      section("最新の配信").queryByRole("link", { name: /すべて表示/ })
    ).not.toBeInTheDocument();
  });

  // #3 配信タイトルと日付を添える（曲カードにも日付が出るため見出し行を厳密に特定する）
  it("labels the latest stream with its title and JST date", () => {
    renderWithProviders(<HomePage />);
    expect(
      section("最新の配信").getByText("春の歌配信 ・ 2024/3/21")
    ).toBeInTheDocument();
  });

  // #4 履歴が空なら最近再生セクションは出ない
  it("hides the recent section when there is no history", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.queryByRole("region", { name: "最近再生した曲" })
    ).not.toBeInTheDocument();
  });

  // #5 履歴があれば出る
  it("shows recently played songs when there is history", () => {
    useHistoryStore.setState({
      history: [{ performanceId: "p1", playedAt: "2024-03-01T00:00:00Z" }],
    });
    renderWithProviders(<HomePage />);
    expect(
      section("最近再生した曲").getByText("天体観測")
    ).toBeInTheDocument();
  });

  // #6 プレイリストが無ければ出ない
  it("hides the playlist section when there are no playlists", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.queryByRole("region", { name: "プレイリスト" })
    ).not.toBeInTheDocument();
  });

  // #7 プレイリストがあれば出る
  it("shows playlists when there are some", () => {
    usePlaylistStore.setState({
      playlists: [{ id: "pl-1", name: "作業BGM", performanceIds: ["p1"] }],
    });
    renderWithProviders(<HomePage />);
    expect(section("プレイリスト").getByText("作業BGM")).toBeInTheDocument();
  });

  // #7b 最近再生も6件まで、超過分は「すべて表示」へ
  it("caps recently played at six and offers a see-all link", () => {
    useHistoryStore.setState({
      history: songPerformances.slice(0, 7).map((sp, i) => ({
        performanceId: sp.performanceId,
        playedAt: `2024-03-0${i + 1}T00:00:00Z`,
      })),
    });
    renderWithProviders(<HomePage />);
    const recent = section("最近再生した曲");
    expect(recent.getAllByRole("listitem")).toHaveLength(6);
    expect(
      recent.getByRole("link", { name: /すべて表示/ })
    ).toBeInTheDocument();
  });

  // #8 プレイリストは6件まで、超過分は「すべて表示」へ
  it("caps playlists at six and offers a see-all link", () => {
    usePlaylistStore.setState({
      playlists: Array.from({ length: 7 }, (_, i) => ({
        id: `pl-${i}`,
        name: `リスト${i}`,
        performanceIds: [],
      })),
    });
    renderWithProviders(<HomePage />);
    const playlists = section("プレイリスト");
    expect(playlists.getByText("リスト5")).toBeInTheDocument();
    expect(playlists.queryByText("リスト6")).not.toBeInTheDocument();
    expect(
      playlists.getByRole("link", { name: /すべて表示/ })
    ).toBeInTheDocument();
  });

  // #9 既存の一覧は従来どおり下に残る
  it("still renders the full song list below the sections", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByRole("button", { name: /シャッフル再生/ })).toBeInTheDocument();
  });
});
