import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "../../test/helpers";
import MonthGrid from "../calendar/MonthGrid";
import { makeStream } from "../../test/fixtures";
import type { Stream } from "../../data/types";

// 2024-02: 1日は木曜。16日に1配信、20日に2配信。
const streamsByDate = new Map<string, Stream[]>([
  ["2024-02-16", [makeStream("v1", "2024-02-16T10:00:00Z")]],
  [
    "2024-02-20",
    [
      makeStream("v2", "2024-02-20T03:00:00Z"),
      makeStream("v3", "2024-02-20T11:00:00Z"),
    ],
  ],
]);

function renderGrid(
  overrides: Partial<React.ComponentProps<typeof MonthGrid>> = {}
) {
  const onSelectDate = vi.fn();
  renderWithProviders(
    <MonthGrid
      monthKey="2024-02"
      streamsByDate={streamsByDate}
      selectedDate={null}
      onSelectDate={onSelectDate}
      {...overrides}
    />
  );
  return { onSelectDate };
}

describe("MonthGrid", () => {
  // #1 曜日ヘッダ（日曜始まり）
  it("renders weekday headers starting from Sunday", () => {
    renderGrid();
    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((h) => h.textContent)).toEqual([
      "日",
      "月",
      "火",
      "水",
      "木",
      "金",
      "土",
    ]);
  });

  // #2 月の全日が並ぶ（うるう年2月は29日）
  it("renders every day of the month", () => {
    renderGrid();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("29")).toBeInTheDocument();
    expect(screen.queryByText("30")).not.toBeInTheDocument();
  });

  // #3 配信がある日は配信数つきのボタンになる
  it("renders a day with streams as a button labeled with its stream count", () => {
    renderGrid();
    expect(
      screen.getByRole("button", { name: "2月16日・1配信" })
    ).toBeInTheDocument();
  });

  // #4 配信がない日はボタンにしない（非活性）
  it("does not render a day without streams as a button", () => {
    renderGrid();
    expect(
      screen.queryByRole("button", { name: /2月5日/ })
    ).not.toBeInTheDocument();
  });

  // #5 2配信以上の日は件数を表示
  it("shows the stream count on a day with multiple streams", () => {
    renderGrid();
    const day20 = screen.getByRole("button", { name: "2月20日・2配信" });
    expect(day20).toHaveTextContent("2配信");
  });

  // #6 配信がある日をタップすると日付キーを通知
  it("calls onSelectDate with the date key when a day with streams is clicked", async () => {
    const user = userEvent.setup();
    const { onSelectDate } = renderGrid();
    await user.click(screen.getByRole("button", { name: "2月16日・1配信" }));
    expect(onSelectDate).toHaveBeenCalledWith("2024-02-16");
  });

  // #7 選択中の日が示される
  it("marks the selected date", () => {
    renderGrid({ selectedDate: "2024-02-16" });
    expect(
      screen.getByRole("button", { name: "2月16日・1配信" })
    ).toHaveAttribute("aria-current", "date");
  });

  // #8 選択されていない日には印をつけない
  it("does not mark unselected dates", () => {
    renderGrid({ selectedDate: "2024-02-16" });
    expect(
      screen.getByRole("button", { name: "2月20日・2配信" })
    ).not.toHaveAttribute("aria-current");
  });
});
