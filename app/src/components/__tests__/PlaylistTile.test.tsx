import { describe, it, expect } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../test/helpers";
import LocationDisplay from "../../test/LocationDisplay";
import PlaylistTile from "../home/PlaylistTile";
import { songPerformances } from "../../data/songs";
import type { Playlist } from "../../stores/playlistStore";

const firstSong = songPerformances[0];

const playlist: Playlist = {
  id: "pl-1",
  name: "作業BGM",
  performanceIds: [firstSong.performanceId, songPerformances[1].performanceId],
};

const emptyPlaylist: Playlist = {
  id: "pl-2",
  name: "からっぽ",
  performanceIds: [],
};

describe("PlaylistTile", () => {
  // #1 名前
  it("shows the playlist name", () => {
    renderWithProviders(<PlaylistTile playlist={playlist} />);
    expect(screen.getByText("作業BGM")).toBeInTheDocument();
  });

  // #2 曲数
  it("shows the number of songs", () => {
    renderWithProviders(<PlaylistTile playlist={playlist} />);
    expect(screen.getByText("2曲")).toBeInTheDocument();
  });

  // #3 サムネは先頭曲のもの（装飾画像なので alt="" = a11yツリー外。要素で直接検証する）
  it("uses the first song's thumbnail", () => {
    const { container } = renderWithProviders(
      <PlaylistTile playlist={playlist} />
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      firstSong.thumbnailUrl
    );
  });

  // #4 空のプレイリストはサムネなしでも壊れない
  it("renders an empty playlist without a thumbnail", () => {
    const { container } = renderWithProviders(
      <PlaylistTile playlist={emptyPlaylist} />
    );
    expect(screen.getByText("からっぽ")).toBeInTheDocument();
    expect(screen.getByText("0曲")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  // #5 タップでプレイリスト詳細へ
  it("navigates to the playlist page when clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <PlaylistTile playlist={playlist} />
        <LocationDisplay />
      </>
    );
    await user.click(screen.getByRole("button", { name: /作業BGM/ }));
    expect(screen.getByTestId("pathname")).toHaveTextContent("/playlist/pl-1");
  });
});

describe("PlaylistTile の横型", () => {
  // 1列表示では大サムネが全幅になって不格好なので、横型に切り替えられる
  // （img は常に枠いっぱい。幅を持っているのは親のラッパー）
  it("keeps the thumbnail at a fixed width in the horizontal variant", () => {
    const { container } = renderWithProviders(
      <PlaylistTile playlist={playlist} variant="horizontal" />
    );
    const wrapper = container.querySelector("img")!.parentElement!;
    expect(getComputedStyle(wrapper).width).toBe("56px");
  });

  it("lets the thumbnail span the full width in the vertical variant", () => {
    const { container } = renderWithProviders(
      <PlaylistTile playlist={playlist} variant="vertical" />
    );
    const wrapper = container.querySelector("img")!.parentElement!;
    expect(getComputedStyle(wrapper).width).toBe("100%");
  });

  it("still shows the name and count in the horizontal variant", () => {
    renderWithProviders(<PlaylistTile playlist={playlist} variant="horizontal" />);
    expect(screen.getByText("作業BGM")).toBeInTheDocument();
    expect(screen.getByText("2曲")).toBeInTheDocument();
  });
});
