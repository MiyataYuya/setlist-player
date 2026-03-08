import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilteredSongs } from "../useFilteredSongs";
import { useLibraryStore } from "../../stores/libraryStore";
import { songPerformances } from "../../data/songs";

describe("useFilteredSongs", () => {
  beforeEach(() => {
    useLibraryStore.setState({ searchQuery: "" });
  });

  // #1 empty query returns all
  it("returns all performances when query is empty", () => {
    const { result } = renderHook(() => useFilteredSongs());
    expect(result.current).toEqual(songPerformances);
  });

  // #2 title search
  it("filters by title", () => {
    act(() => useLibraryStore.getState().setSearchQuery("天体観測"));
    const { result } = renderHook(() => useFilteredSongs());
    expect(result.current.every((s) => s.title.includes("天体観測"))).toBe(true);
    expect(result.current.length).toBeGreaterThan(0);
  });

  // #3 artist search
  it("filters by artist", () => {
    act(() => useLibraryStore.getState().setSearchQuery("LiSA"));
    const { result } = renderHook(() => useFilteredSongs());
    expect(result.current.every((s) => s.artist.includes("LiSA"))).toBe(true);
    expect(result.current.length).toBeGreaterThan(0);
  });

  // #4 case insensitive
  it("case-insensitive: 'bump' matches 'BUMP OF CHICKEN'", () => {
    act(() => useLibraryStore.getState().setSearchQuery("bump"));
    const { result } = renderHook(() => useFilteredSongs());
    expect(result.current.some((s) => s.artist === "BUMP OF CHICKEN")).toBe(true);
  });

  // #5 no match
  it("returns empty array when nothing matches", () => {
    act(() => useLibraryStore.getState().setSearchQuery("zzzznotfound"));
    const { result } = renderHook(() => useFilteredSongs());
    expect(result.current).toHaveLength(0);
  });
});
