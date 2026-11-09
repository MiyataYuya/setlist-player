import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import type { YouTubeEvent } from "react-youtube";
import YouTubeEmbed from "../player/YouTubeEmbed";
import { usePlayerStore, setPlayerRef } from "../../stores/playerStore";
import type { SongPerformance } from "../../data/types";

// react-youtube は実ブラウザの IFrame API を要するため、onReady を捕まえて
// テストから任意のプレイヤーで「準備完了」を発火できるスタブに差し替える
const yt = vi.hoisted(() => ({
  onReady: undefined as ((e: YouTubeEvent) => void) | undefined,
}));
vi.mock("react-youtube", () => ({
  default: (props: { onReady?: (e: YouTubeEvent) => void }) => {
    yt.onReady = props.onReady;
    return null;
  },
}));

function makeSong(id: string, videoId: string, startSeconds: number): SongPerformance {
  return {
    performanceId: id,
    songId: `song-${id}`,
    title: `Title ${id}`,
    artist: `Artist ${id}`,
    videoId,
    startSeconds,
    endSeconds: startSeconds + 300,
    publishedAt: "2024-01-01T00:00:00Z",
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    style: null,
  };
}

const songA = makeSong("a", "video-a", 10);
const songB = makeSong("b", "video-b", 20);

// YT.Player の代役。destroy 後は本物と同じく iframe を失い、メソッド呼出しで落ちる
function makePlayer(videoId: string) {
  let iframe: HTMLIFrameElement | null = document.createElement("iframe");
  const ensureAlive = () => {
    if (!iframe) throw new TypeError("Cannot read properties of null (reading 'src')");
  };
  return {
    getIframe: () => iframe,
    destroy: () => {
      iframe = null;
    },
    getVideoUrl: () => `https://www.youtube.com/watch?v=${videoId}`,
    getCurrentTime: () => 0,
    loadVideoById: vi.fn(ensureAlive),
    seekTo: vi.fn(ensureAlive),
    playVideo: vi.fn(ensureAlive),
    pauseVideo: vi.fn(ensureAlive),
  };
}

function fireReady(player: ReturnType<typeof makePlayer>) {
  act(() => yt.onReady?.({ data: null, target: player }));
}

describe("YouTubeEmbed", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      queue: [songA, songB],
      currentIndex: 0,
      isPlaying: true,
      isRepeat: false,
      isPlayerOpen: false,
    });
  });

  afterEach(() => {
    setPlayerRef(null);
    yt.onReady = undefined;
  });

  // 生成時の曲のまま準備完了したら、読み込み直さない
  it("does not reload when the song is unchanged at ready", () => {
    render(<YouTubeEmbed />);
    const player = makePlayer(songA.videoId);
    fireReady(player);
    expect(player.loadVideoById).not.toHaveBeenCalled();
  });

  // 準備完了より前に曲が変わっていたら、準備完了したプレイヤーで今の曲を読み込む
  it("loads the current song when it changed before the player became ready", () => {
    render(<YouTubeEmbed />);
    act(() => usePlayerStore.getState().playNext());

    const player = makePlayer(songA.videoId);
    fireReady(player);

    expect(player.loadVideoById).toHaveBeenCalledWith({
      videoId: songB.videoId,
      startSeconds: songB.startSeconds,
    });
  });

  // StrictMode の再マウントでは react-youtube が破棄予定のプレイヤーでも onReady を発火し、
  // 直後に destroy する。その破棄済みプレイヤーを操作せず、次に準備完了した方で今の曲を読み込む
  it("ignores a player destroyed after ready and loads the song on the next ready player", () => {
    render(<YouTubeEmbed />);
    const discarded = makePlayer(songA.videoId);
    fireReady(discarded);
    discarded.destroy();

    act(() => usePlayerStore.getState().playNext());
    expect(discarded.loadVideoById).not.toHaveBeenCalled();

    const live = makePlayer(songA.videoId);
    fireReady(live);
    expect(live.loadVideoById).toHaveBeenCalledWith({
      videoId: songB.videoId,
      startSeconds: songB.startSeconds,
    });
  });
});
