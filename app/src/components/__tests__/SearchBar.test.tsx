import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "../../test/helpers";
import SearchBar from "../songs/SearchBar";
import { useLibraryStore } from "../../stores/libraryStore";

describe("SearchBar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    useLibraryStore.setState({ searchQuery: "" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // #4 placeholder
  it('displays placeholder "曲名・アーティストで検索"', () => {
    renderWithProviders(<SearchBar />);
    expect(screen.getByPlaceholderText("曲名・アーティストで検索")).toBeInTheDocument();
  });

  // #1 input updates local state
  it("updates input value immediately", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<SearchBar />);
    const input = screen.getByPlaceholderText("曲名・アーティストで検索");
    await user.type(input, "test");
    expect(input).toHaveValue("test");
  });

  // #2 debounce
  it("sets search query after 300ms debounce", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<SearchBar />);
    const input = screen.getByPlaceholderText("曲名・アーティストで検索");
    await user.type(input, "bump");
    vi.advanceTimersByTime(300);
    await waitFor(() => {
      expect(useLibraryStore.getState().searchQuery).toBe("bump");
    });
  });

  // #3 consecutive input
  it("only sets final value on consecutive input", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<SearchBar />);
    const input = screen.getByPlaceholderText("曲名・アーティストで検索");
    await user.type(input, "abc");
    vi.advanceTimersByTime(100);
    await user.clear(input);
    await user.type(input, "xyz");
    vi.advanceTimersByTime(300);
    await waitFor(() => {
      expect(useLibraryStore.getState().searchQuery).toBe("xyz");
    });
  });
});
