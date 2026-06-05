import { describe, it, expect, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { screen, setMatchMedia } from "../../test/helpers";
import theme from "../../theme";
import App from "../../App";
import { usePlayerStore } from "../../stores/playerStore";

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
});
