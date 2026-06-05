import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { screen, setMatchMedia } from "../../test/helpers";
import theme from "../../theme";
import App from "../../App";

function renderApp() {
  return render(
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
}

describe("App responsive shell", () => {
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
});
