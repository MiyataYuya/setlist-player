import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useLibraryStore } from "../libraryStore";

describe("libraryStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useLibraryStore.setState({ favoriteIds: [], searchQuery: "" });
  });

  // #1 toggleFavorite add
  it("toggleFavorite adds id to favoriteIds", () => {
    act(() => useLibraryStore.getState().toggleFavorite("p1"));
    expect(useLibraryStore.getState().favoriteIds).toContain("p1");
  });

  // #2 toggleFavorite remove
  it("toggleFavorite removes id from favoriteIds", () => {
    useLibraryStore.setState({ favoriteIds: ["p1", "p2"] });
    act(() => useLibraryStore.getState().toggleFavorite("p1"));
    expect(useLibraryStore.getState().favoriteIds).not.toContain("p1");
    expect(useLibraryStore.getState().favoriteIds).toContain("p2");
  });

  // #3 isFavorite
  it("isFavorite returns true for registered, false for unregistered", () => {
    useLibraryStore.setState({ favoriteIds: ["p1"] });
    expect(useLibraryStore.getState().isFavorite("p1")).toBe(true);
    expect(useLibraryStore.getState().isFavorite("p2")).toBe(false);
  });

  // #4 setSearchQuery
  it("setSearchQuery updates searchQuery", () => {
    act(() => useLibraryStore.getState().setSearchQuery("bump"));
    expect(useLibraryStore.getState().searchQuery).toBe("bump");
  });

  // #5 localStorage persistence
  it("persists favoriteIds to localStorage", () => {
    act(() => useLibraryStore.getState().toggleFavorite("p1"));
    const stored = JSON.parse(localStorage.getItem("karaoke-library") ?? "{}");
    expect(stored.state.favoriteIds).toContain("p1");
  });
});
