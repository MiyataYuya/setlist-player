import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInfiniteScroll } from "../useInfiniteScroll";

function makeItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({ id: i }));
}

describe("useInfiniteScroll", () => {
  // #1 initial display
  it("returns first 50 items initially", () => {
    const items = makeItems(100);
    const { result } = renderHook(() => useInfiniteScroll(items));
    expect(result.current.visibleItems).toHaveLength(50);
  });

  // #2 hasMore
  it("hasMore is true when items > visibleCount", () => {
    const items = makeItems(100);
    const { result } = renderHook(() => useInfiniteScroll(items));
    expect(result.current.hasMore).toBe(true);
  });

  it("hasMore is false when items <= PAGE_SIZE", () => {
    const items = makeItems(30);
    const { result } = renderHook(() => useInfiniteScroll(items));
    expect(result.current.hasMore).toBe(false);
  });

  // #3 reset on items change
  it("resets visibleCount when items change", () => {
    const items100 = makeItems(100);
    const items200 = makeItems(200);
    const { result, rerender } = renderHook(
      ({ items }) => useInfiniteScroll(items),
      { initialProps: { items: items100 } }
    );

    expect(result.current.visibleItems).toHaveLength(50);
    rerender({ items: items200 });
    expect(result.current.visibleItems).toHaveLength(50);
  });
});
