import { describe, it, expect, beforeEach } from "vitest";
import { Route, Routes } from "react-router-dom";
import { within } from "@testing-library/react";
import { renderWithRoute, screen, userEvent } from "../../test/helpers";
import SongPage from "../../pages/SongPage";
import { usePlayerStore } from "../../stores/playerStore";

// フィクスチャの s1「天体観測」は p1（v1・弾き語り・JST 2024/1/16）と p4（v2・歌枠・JST 2024/2/11）
function renderSongPage(songId: string) {
  return renderWithRoute(
    <Routes>
      <Route path="/song/:songId" element={<SongPage />} />
    </Routes>,
    [`/song/${songId}`]
  );
}

function listedDates(): string[] {
  return within(screen.getByTestId("song-list"))
    .getAllByRole("listitem")
    .map((item) => item.textContent?.match(/\d{4}\/\d{1,2}\/\d{1,2}/)?.[0] ?? "");
}

describe("SongPage", () => {
  beforeEach(() => {
    usePlayerStore.setState({ queue: [], currentIndex: -1, isPlaying: false });
  });

  // #1 曲名・アーティストを見出しにする
  it("shows the song title and artist", () => {
    renderSongPage("s1");
    expect(screen.getByRole("heading", { name: "天体観測" })).toBeInTheDocument();
    expect(screen.getByText("BUMP OF CHICKEN")).toBeInTheDocument();
  });

  // #2 歌唱回数と内訳
  it("summarises how many times it was sung, by style", () => {
    renderSongPage("s1");
    expect(screen.getByText("2回 ・ 弾き語り 1・歌枠 1")).toBeInTheDocument();
  });

  // #3 新しい順に全演奏を並べる
  it("lists every performance newest first", () => {
    renderSongPage("s1");
    expect(listedDates()).toEqual(["2024/2/11", "2024/1/16"]);
  });

  // #4 演奏スタイルで絞り込める
  it("filters performances by style", async () => {
    const user = userEvent.setup();
    renderSongPage("s1");
    await user.click(screen.getByRole("button", { name: "弾き語り" }));
    expect(listedDates()).toEqual(["2024/1/16"]);
  });

  // #5 一覧の順でまとめて再生する
  it("plays the listed performances in order", async () => {
    const user = userEvent.setup();
    renderSongPage("s1");
    await user.click(screen.getByRole("button", { name: /すべて再生/ }));
    const { queue, currentIndex } = usePlayerStore.getState();
    expect(queue.map((s) => s.performanceId)).toEqual(["p4", "p1"]);
    expect(currentIndex).toBe(0);
  });

  // #6 存在しない曲
  it("shows a message for an unknown song", () => {
    renderSongPage("nope");
    expect(screen.getByText("曲が見つかりません")).toBeInTheDocument();
  });
});
