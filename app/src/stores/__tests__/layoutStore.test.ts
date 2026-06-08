import { describe, it, expect, beforeEach } from "vitest";
import {
  useLayoutStore,
  MIN_PLAYER_PANE_WIDTH,
  MAX_PLAYER_PANE_WIDTH,
} from "../layoutStore";

describe("layoutStore", () => {
  beforeEach(() => {
    useLayoutStore.setState({ playerPaneWidth: 360 });
  });

  it("defaults playerPaneWidth to 360", () => {
    expect(useLayoutStore.getState().playerPaneWidth).toBe(360);
  });

  it("sets a width within range", () => {
    useLayoutStore.getState().setPlayerPaneWidth(420);
    expect(useLayoutStore.getState().playerPaneWidth).toBe(420);
  });

  it("clamps below MIN to MIN", () => {
    useLayoutStore.getState().setPlayerPaneWidth(100);
    expect(useLayoutStore.getState().playerPaneWidth).toBe(MIN_PLAYER_PANE_WIDTH);
  });

  it("clamps above MAX to MAX", () => {
    useLayoutStore.getState().setPlayerPaneWidth(9999);
    expect(useLayoutStore.getState().playerPaneWidth).toBe(MAX_PLAYER_PANE_WIDTH);
  });

  it("rounds fractional widths to integers", () => {
    useLayoutStore.getState().setPlayerPaneWidth(400.7);
    expect(useLayoutStore.getState().playerPaneWidth).toBe(401);
  });
});
