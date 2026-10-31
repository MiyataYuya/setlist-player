import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../test/helpers";
import CalendarPage from "../../pages/CalendarPage";
import { usePlayerStore } from "../../stores/playerStore";
import { useLibraryStore } from "../../stores/libraryStore";

// モック配信のJST日付: 2024-01-16 / 2024-02-11 / 2024-03-06(2配信) / 2024-03-21
describe("CalendarPage", () => {
  beforeEach(() => {
    usePlayerStore.setState({ queue: [], currentIndex: -1, isPlaying: false });
    useLibraryStore.setState({ favoriteIds: [] });
  });

  // #1 初期表示は配信のある最新の月
  it("opens on the most recent month that has streams", () => {
    renderWithProviders(<CalendarPage />);
    expect(screen.getByText("2024年3月")).toBeInTheDocument();
  });

  // #2 初期選択はその月の最新配信日
  it("selects the most recent stream date of that month", () => {
    renderWithProviders(<CalendarPage />);
    expect(screen.getByText("2024年3月21日（木）")).toBeInTheDocument();
  });

  // #3 選択日の配信が配信カードとして出る
  it("shows the selected date's stream as a card", () => {
    renderWithProviders(<CalendarPage />);
    expect(screen.getByText("春の歌配信")).toBeInTheDocument();
  });

  // #4 別の配信日をタップすると選択が切り替わる
  it("switches the selected date when another day is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CalendarPage />);
    await user.click(screen.getByRole("button", { name: "3月6日・2配信" }));
    expect(screen.getByText("2024年3月6日（水）")).toBeInTheDocument();
  });

  // #5 同じ日に2配信ある場合は両方出る
  it("lists every stream of a day that has multiple streams", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CalendarPage />);
    await user.click(screen.getByRole("button", { name: "3月6日・2配信" }));
    expect(screen.getByText("歌配信")).toBeInTheDocument();
    expect(screen.getByText("二人で歌枠")).toBeInTheDocument();
  });

  // #6 前の月へ移動すると、その月の最新配信日が選ばれる
  it("moves to the previous month and selects its most recent stream date", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CalendarPage />);
    await user.click(screen.getByRole("button", { name: "前の月" }));
    expect(screen.getByText("2024年2月")).toBeInTheDocument();
    expect(screen.getByText("2024年2月11日（日）")).toBeInTheDocument();
  });

  // #7 最新月では次の月へ進めない
  it("disables forward navigation on the most recent month", () => {
    renderWithProviders(<CalendarPage />);
    expect(screen.getByRole("button", { name: "次の月" })).toBeDisabled();
  });

  // #8 最古月では前の月へ戻れない
  it("disables backward navigation on the oldest month", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CalendarPage />);
    const prev = screen.getByRole("button", { name: "前の月" });
    await user.click(prev);
    await user.click(prev);
    expect(screen.getByText("2024年1月")).toBeInTheDocument();
    expect(prev).toBeDisabled();
  });
});
