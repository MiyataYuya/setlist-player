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

describe("layoutStore の表示モード", () => {
  beforeEach(() => {
    useLayoutStore.setState({ songViewMode: null });
  });

  // 未設定なら null（画面幅から決める側に委ねる）
  it("starts with no explicit view mode", () => {
    expect(useLayoutStore.getState().songViewMode).toBeNull();
  });

  // 明示的に設定できる
  it("stores the chosen view mode", () => {
    useLayoutStore.getState().setSongViewMode("grid");
    expect(useLayoutStore.getState().songViewMode).toBe("grid");
  });

  // 上書きできる
  it("overwrites a previously chosen mode", () => {
    useLayoutStore.getState().setSongViewMode("grid");
    useLayoutStore.getState().setSongViewMode("list");
    expect(useLayoutStore.getState().songViewMode).toBe("list");
  });
});
