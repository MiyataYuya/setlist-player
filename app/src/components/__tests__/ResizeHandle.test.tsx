import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent } from "@testing-library/react";
import { renderWithProviders, screen } from "../../test/helpers";
import ResizeHandle from "../layout/ResizeHandle";
import {
  useLayoutStore,
  MIN_PLAYER_PANE_WIDTH,
  MAX_PLAYER_PANE_WIDTH,
} from "../../stores/layoutStore";

// jsdom は Pointer Capture API を実装していないためスタブ
beforeEach(() => {
  const captured = new Set<number>();
  Element.prototype.setPointerCapture = function (id: number) { captured.add(id); };
  Element.prototype.releasePointerCapture = function (id: number) { captured.delete(id); };
  Element.prototype.hasPointerCapture = function (id: number) { return captured.has(id); };
  useLayoutStore.setState({ playerPaneWidth: 360 });
});

describe("ResizeHandle", () => {
  it("renders a vertical separator with aria values", () => {
    renderWithProviders(<ResizeHandle />);
    const handle = screen.getByRole("separator");
    expect(handle).toHaveAttribute("aria-orientation", "vertical");
    expect(handle).toHaveAttribute("aria-valuenow", "360");
    expect(handle).toHaveAttribute("aria-valuemin", String(MIN_PLAYER_PANE_WIDTH));
    expect(handle).toHaveAttribute("aria-valuemax", String(MAX_PLAYER_PANE_WIDTH));
  });

  it("widens the player pane on ArrowLeft and narrows on ArrowRight", () => {
    renderWithProviders(<ResizeHandle />);
    const handle = screen.getByRole("separator");
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(useLayoutStore.getState().playerPaneWidth).toBe(384);
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(useLayoutStore.getState().playerPaneWidth).toBe(360);
  });

  it("Home jumps to MIN and End jumps to MAX", () => {
    renderWithProviders(<ResizeHandle />);
    const handle = screen.getByRole("separator");
    fireEvent.keyDown(handle, { key: "Home" });
    expect(useLayoutStore.getState().playerPaneWidth).toBe(MIN_PLAYER_PANE_WIDTH);
    fireEvent.keyDown(handle, { key: "End" });
    expect(useLayoutStore.getState().playerPaneWidth).toBe(MAX_PLAYER_PANE_WIDTH);
  });

  it("updates width from pointer drag (width = innerWidth - clientX)", () => {
    renderWithProviders(<ResizeHandle />);
    const handle = screen.getByRole("separator");
    // innerWidth は jsdom 既定 1024。clientX=624 → 幅 400
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 700 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 624 });
    expect(useLayoutStore.getState().playerPaneWidth).toBe(1024 - 624);
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 624 });
  });

  it("clamps pointer drag beyond MAX", () => {
    renderWithProviders(<ResizeHandle />);
    const handle = screen.getByRole("separator");
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 700 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 0 }); // 幅1024 → MAXにクランプ
    expect(useLayoutStore.getState().playerPaneWidth).toBe(MAX_PLAYER_PANE_WIDTH);
  });

  it("ignores pointer move when no drag is in progress", () => {
    renderWithProviders(<ResizeHandle />);
    const handle = screen.getByRole("separator");
    // pointerDown を呼ばずに move しても幅は変わらない
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 100 });
    expect(useLayoutStore.getState().playerPaneWidth).toBe(360);
  });
});
