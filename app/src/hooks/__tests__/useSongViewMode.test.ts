import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSongViewMode } from "../useSongViewMode";
import { useLayoutStore } from "../../stores/layoutStore";
import { setMatchMedia } from "../../test/helpers";

describe("useSongViewMode", () => {
  beforeEach(() => {
    useLayoutStore.setState({ songViewMode: null });
  });

  // #1 未設定のPCはタイル
  it("defaults to tile on a desktop width", () => {
    setMatchMedia(true);
    const { result } = renderHook(() => useSongViewMode());
    expect(result.current).toBe("tile");
  });

  // #2 未設定のスマホはリスト
  it("defaults to list on a mobile width", () => {
    setMatchMedia(false);
    const { result } = renderHook(() => useSongViewMode());
    expect(result.current).toBe("list");
  });

  // #3 保存された設定は画面幅より優先する
  it("prefers the stored mode over the width default", () => {
    setMatchMedia(true);
    useLayoutStore.setState({ songViewMode: "grid" });
    const { result } = renderHook(() => useSongViewMode());
    expect(result.current).toBe("grid");
  });

  // #4 スマホでも保存された設定が優先される
  it("keeps the stored mode on a mobile width too", () => {
    setMatchMedia(false);
    useLayoutStore.setState({ songViewMode: "tile" });
    const { result } = renderHook(() => useSongViewMode());
    expect(result.current).toBe("tile");
  });
});
