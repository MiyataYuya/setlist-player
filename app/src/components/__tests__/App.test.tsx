import { describe, it, expect, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { screen, setMatchMedia, act } from "../../test/helpers";
import theme from "../../theme";
import App from "../../App";
import { usePlayerStore } from "../../stores/playerStore";
import { useLayoutStore } from "../../stores/layoutStore";
import { songPerformances } from "../../data/songs";

// react-youtube は実ブラウザの IFrame API を要するため、videoId を観測できる
// 軽量プレースホルダに差し替える。これにより YouTubeEmbed が生成時に渡す
// videoId を検証できる。
vi.mock("react-youtube", () => ({
  default: ({ videoId }: { videoId: string }) => (
    <div data-testid="yt-player" data-video-id={videoId} />
  ),
}));

function renderApp() {
  return render(
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
}

describe("App responsive shell", () => {
  afterEach(() => {
    usePlayerStore.setState({ queue: [], currentIndex: -1, isPlayerOpen: false });
    useLayoutStore.setState({ playerPaneWidth: 360 });
  });

  it("shows SideNav and hides BottomNav on desktop", () => {
    setMatchMedia(true);
    renderApp();
    expect(screen.getByText("セトリプレイヤー")).toBeInTheDocument();
    expect(document.querySelector(".MuiBottomNavigation-root")).toBeNull();
  });

  it("shows BottomNav and hides SideNav on mobile", () => {
    setMatchMedia(false);
    renderApp();
    expect(document.querySelector(".MuiBottomNavigation-root")).not.toBeNull();
    expect(screen.queryByText("セトリプレイヤー")).not.toBeInTheDocument();
  });

  it("renders the player pane on desktop even with no current song", () => {
    setMatchMedia(true);
    // 曲が無い状態にする
    usePlayerStore.setState({ queue: [], currentIndex: -1, isPlayerOpen: false });
    renderApp();
    expect(screen.getByText("曲を選択してください")).toBeInTheDocument();
  });

  it("shows the resize handle on desktop", () => {
    setMatchMedia(true);
    renderApp();
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("does not show the resize handle on mobile", () => {
    setMatchMedia(false);
    renderApp();
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("reflects the layout store width on the desktop resize handle", () => {
    setMatchMedia(true);
    useLayoutStore.setState({ playerPaneWidth: 500 });
    renderApp();
    expect(screen.getByRole("separator")).toHaveAttribute("aria-valuenow", "500");
  });

  it("PCで最初に選んだ曲が正しい videoId でプレイヤーにマウントされる", async () => {
    setMatchMedia(true);
    const sample = songPerformances[0];

    renderApp(); // 曲なしでマウント（PCではプレイヤー枠が常設される）
    // 曲未選択ではプレイヤー本体（iframe）はマウントしない
    expect(screen.queryByTestId("yt-player")).toBeNull();

    // 最初の曲を選択
    await act(async () => {
      usePlayerStore.getState().playSong(sample, [sample]);
    });

    // 最初に選んだ曲が正しい videoId で読み込まれること（空文字で固定されない）
    expect(screen.getByTestId("yt-player")).toHaveAttribute(
      "data-video-id",
      sample.videoId
    );
  });

  it("pushes at most one history entry per player-open session on mobile", async () => {
    setMatchMedia(false);
    const pushSpy = vi.spyOn(window.history, "pushState");
    const sample = songPerformances[0];

    const { rerender } = renderApp();
    // 再生開始 → isPlayerOpen=true（1回push）
    await act(async () => {
      usePlayerStore.getState().playSong(sample, [sample]);
    });
    const afterOpen = pushSpy.mock.calls.length;
    expect(afterOpen).toBeGreaterThanOrEqual(1);

    // isPlayerOpen が true のまま再レンダーが起きても push は増えない
    await act(async () => {
      usePlayerStore.setState({ isPlaying: false }); // 無関係な更新で再レンダー誘発
    });
    expect(pushSpy.mock.calls.length).toBe(afterOpen);

    // ブレークポイント往復（mobile→desktop→mobile）で isPlayerOpen が true のまま
    // effect が再発火しても、開セッション中は push が増えてはならない（本バグの核心）。
    // mobile → desktop（isDesktop=true。!isDesktop=false なので push しない）
    await act(async () => {
      setMatchMedia(true);
      rerender(
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      );
    });
    // desktop → mobile（isDesktop=false に戻る。isPlayerOpen は true のまま）
    await act(async () => {
      setMatchMedia(false);
      rerender(
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      );
    });
    expect(pushSpy.mock.calls.length).toBe(afterOpen);

    // 閉じて再度開くと push される（セッションがリセットされる）
    await act(async () => {
      usePlayerStore.getState().closePlayer();
    });
    await act(async () => {
      usePlayerStore.getState().playSong(sample, [sample]);
    });
    expect(pushSpy.mock.calls.length).toBe(afterOpen + 1);

    pushSpy.mockRestore();
  });
});
