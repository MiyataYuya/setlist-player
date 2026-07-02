# 検索ページ空状態改善 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 検索ページ未入力時に「曲が見つかりません」ではなく、誘導文＋最近再生した曲を表示する。

**Architecture:** 新規フック `useRecentSongs` が `historyStore` の履歴を重複排除して `SongPerformance[]` に変換する。`SearchPage` は `searchQuery.trim()` で「検索中／未検索」を分岐し、未検索時は誘導文と履歴リストを表示する。`SongList` は変更しない。

**Tech Stack:** React 19, TypeScript, Zustand v5, MUI v7, Vitest + @testing-library/react

## Global Constraints

- 作業ディレクトリは `app/`。テスト実行は `npx vitest run <path>`
- UIテキスト・コメントは日本語
- テスト時は `virtual:*` モジュールが `src/test/__mocks__/` に置換される（performanceId は p1〜p7、曲は s1:天体観測 / s2:紅蓮華 / s3:夜に駆ける / s4:Lemon / s5:残酷な天使のテーゼ）
- TDD: テストを先に書き、失敗を確認してから実装する

---

### Task 1: useRecentSongs フック

**Files:**
- Create: `app/src/hooks/useRecentSongs.ts`
- Test: `app/src/hooks/__tests__/useRecentSongs.test.ts`

**Interfaces:**
- Consumes: `useHistoryStore`（`history: { performanceId: string; playedAt: string }[]`、新しい順）、`songPerformances`（`src/data/songs.ts`）
- Produces: `useRecentSongs(limit?: number): SongPerformance[]` — 既定 limit=10。履歴の新しい順、performanceId 重複排除、存在しないIDは除外

- [ ] **Step 1: 失敗するテストを書く**

```ts
// app/src/hooks/__tests__/useRecentSongs.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRecentSongs } from "../useRecentSongs";
import { useHistoryStore } from "../../stores/historyStore";

function entry(performanceId: string, playedAt: string) {
  return { performanceId, playedAt };
}

describe("useRecentSongs", () => {
  beforeEach(() => {
    useHistoryStore.setState({ history: [] });
  });

  // #1 履歴なし
  it("履歴が空なら空配列を返す", () => {
    const { result } = renderHook(() => useRecentSongs());
    expect(result.current).toEqual([]);
  });

  // #2 新しい順の変換
  it("履歴の順序（新しい順）で SongPerformance を返す", () => {
    useHistoryStore.setState({
      history: [entry("p3", "2024-03-01T00:00:00Z"), entry("p1", "2024-02-01T00:00:00Z")],
    });
    const { result } = renderHook(() => useRecentSongs());
    expect(result.current.map((s) => s.performanceId)).toEqual(["p3", "p1"]);
    expect(result.current[0].title).toBe("夜に駆ける");
  });

  // #3 重複排除（最新を優先）
  it("同じ performanceId は最新の1件だけ残す", () => {
    useHistoryStore.setState({
      history: [
        entry("p1", "2024-03-03T00:00:00Z"),
        entry("p2", "2024-03-02T00:00:00Z"),
        entry("p1", "2024-03-01T00:00:00Z"),
      ],
    });
    const { result } = renderHook(() => useRecentSongs());
    expect(result.current.map((s) => s.performanceId)).toEqual(["p1", "p2"]);
  });

  // #4 存在しないIDの除外
  it("songPerformances に存在しない ID は除外する", () => {
    useHistoryStore.setState({
      history: [entry("p999", "2024-03-02T00:00:00Z"), entry("p1", "2024-03-01T00:00:00Z")],
    });
    const { result } = renderHook(() => useRecentSongs());
    expect(result.current.map((s) => s.performanceId)).toEqual(["p1"]);
  });

  // #5 上限
  it("limit 件で打ち切る", () => {
    useHistoryStore.setState({
      history: [
        entry("p1", "2024-03-03T00:00:00Z"),
        entry("p2", "2024-03-02T00:00:00Z"),
        entry("p3", "2024-03-01T00:00:00Z"),
      ],
    });
    const { result } = renderHook(() => useRecentSongs(2));
    expect(result.current.map((s) => s.performanceId)).toEqual(["p1", "p2"]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/hooks/__tests__/useRecentSongs.test.ts`
Expected: FAIL（`useRecentSongs` が存在しないため import エラー）

- [ ] **Step 3: 最小実装を書く**

```ts
// app/src/hooks/useRecentSongs.ts
import { useMemo } from "react";
import { songPerformances } from "../data/songs";
import { useHistoryStore } from "../stores/historyStore";
import type { SongPerformance } from "../data/types";

const spMap = new Map(songPerformances.map((s) => [s.performanceId, s]));

/** 再生履歴から重複を除いた最近の曲を返す（新しい順、存在しない演奏は除外） */
export function useRecentSongs(limit = 10): SongPerformance[] {
  const history = useHistoryStore((s) => s.history);

  return useMemo(() => {
    const seen = new Set<string>();
    const result: SongPerformance[] = [];
    for (const h of history) {
      if (result.length >= limit) break;
      if (seen.has(h.performanceId)) continue;
      seen.add(h.performanceId);
      const sp = spMap.get(h.performanceId);
      if (sp) result.push(sp);
    }
    return result;
  }, [history, limit]);
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/hooks/__tests__/useRecentSongs.test.ts`
Expected: PASS（5件）

- [ ] **Step 5: コミット**

```bash
git add src/hooks/useRecentSongs.ts src/hooks/__tests__/useRecentSongs.test.ts
git commit -m "feat: 再生履歴から最近の曲を返す useRecentSongs フックを追加"
```

---

### Task 2: SearchPage の空状態表示

**Files:**
- Modify: `app/src/pages/SearchPage.tsx`
- Test: `app/src/components/__tests__/SearchPage.test.tsx`（新規）

**Interfaces:**
- Consumes: `useRecentSongs(): SongPerformance[]`（Task 1）、`useFilteredSongs()`、`useLibraryStore` の `searchQuery`
- Produces: なし（ページコンポーネント）

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// app/src/components/__tests__/SearchPage.test.tsx
import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen } from "../../test/helpers";
import SearchPage from "../../pages/SearchPage";
import { useLibraryStore } from "../../stores/libraryStore";
import { useHistoryStore } from "../../stores/historyStore";
import { usePlayerStore } from "../../stores/playerStore";

describe("SearchPage", () => {
  beforeEach(() => {
    useLibraryStore.setState({ searchQuery: "", favoriteIds: [] });
    useHistoryStore.setState({ history: [] });
    usePlayerStore.setState({ queue: [], currentIndex: -1, isPlaying: false });
  });

  // #1 未入力時は「曲が見つかりません」を出さない
  it("未入力時に「曲が見つかりません」を表示しない", () => {
    renderWithProviders(<SearchPage />);
    expect(screen.queryByText("曲が見つかりません")).not.toBeInTheDocument();
  });

  // #2 未入力時は誘導文を表示
  it("未入力時に誘導文を表示する", () => {
    renderWithProviders(<SearchPage />);
    expect(screen.getByText("曲名やアーティスト名で検索")).toBeInTheDocument();
  });

  // #3 履歴があれば「最近再生した曲」を表示
  it("履歴があれば「最近再生した曲」と曲を表示する", () => {
    useHistoryStore.setState({
      history: [{ performanceId: "p1", playedAt: "2024-03-01T00:00:00Z" }],
    });
    renderWithProviders(<SearchPage />);
    expect(screen.getByText("最近再生した曲")).toBeInTheDocument();
    expect(screen.getByText("天体観測")).toBeInTheDocument();
  });

  // #4 履歴がなければ「最近再生した曲」見出しを出さない
  it("履歴がなければ「最近再生した曲」を表示しない", () => {
    renderWithProviders(<SearchPage />);
    expect(screen.queryByText("最近再生した曲")).not.toBeInTheDocument();
  });

  // #5 空白のみの入力は未入力扱い
  it("空白のみの入力では全曲表示せず誘導文を表示する", () => {
    useLibraryStore.setState({ searchQuery: "   " });
    renderWithProviders(<SearchPage />);
    expect(screen.getByText("曲名やアーティスト名で検索")).toBeInTheDocument();
    expect(screen.queryByText(/件$/)).not.toBeInTheDocument();
  });

  // #6 入力時は結果と件数を表示
  it("入力時は検索結果と件数を表示し、誘導文を出さない", () => {
    useLibraryStore.setState({ searchQuery: "紅蓮華" });
    renderWithProviders(<SearchPage />);
    // モックデータには「紅蓮華」の演奏が複数あるため getAllByText を使う
    expect(screen.getAllByText("紅蓮華").length).toBeGreaterThan(0);
    expect(screen.getByText(/件/)).toBeInTheDocument();
    expect(screen.queryByText("曲名やアーティスト名で検索")).not.toBeInTheDocument();
  });

  // #7 入力してヒット0件なら「曲が見つかりません」
  it("ヒット0件なら「曲が見つかりません」を表示する", () => {
    useLibraryStore.setState({ searchQuery: "zzzznotfound" });
    renderWithProviders(<SearchPage />);
    expect(screen.getByText("曲が見つかりません")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/components/__tests__/SearchPage.test.tsx`
Expected: FAIL（#1, #2, #3, #4, #5 が失敗。現実装は未入力時に「曲が見つかりません」を表示するため）

- [ ] **Step 3: SearchPage を実装**

```tsx
// app/src/pages/SearchPage.tsx（全体を置き換え）
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";
import SearchBar from "../components/songs/SearchBar";
import SongList from "../components/songs/SongList";
import { useFilteredSongs } from "../hooks/useFilteredSongs";
import { useRecentSongs } from "../hooks/useRecentSongs";
import { useLibraryStore } from "../stores/libraryStore";

export default function SearchPage() {
  const songs = useFilteredSongs();
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const recentSongs = useRecentSongs();
  const isSearching = searchQuery.trim().length > 0;

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          検索
        </Typography>
        <SearchBar />
        {isSearching && (
          <Typography variant="body2" color="text.secondary">
            {songs.length} 件
          </Typography>
        )}
      </Box>
      {isSearching ? (
        <SongList songs={songs} />
      ) : (
        <>
          <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
            <SearchIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography color="text.secondary">曲名やアーティスト名で検索</Typography>
          </Box>
          {recentSongs.length > 0 && (
            <>
              <Box sx={{ px: 2, mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  最近再生した曲
                </Typography>
              </Box>
              <SongList songs={recentSongs} />
            </>
          )}
        </>
      )}
    </Box>
  );
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/components/__tests__/SearchPage.test.tsx`
Expected: PASS（7件）

- [ ] **Step 5: 全テスト・lint・ビルドで回帰確認**

Run: `npm run test && npm run lint && npm run build`
Expected: すべて成功（既存テストに SearchPage の旧挙動へ依存するものはない）

- [ ] **Step 6: コミット**

```bash
git add src/pages/SearchPage.tsx src/components/__tests__/SearchPage.test.tsx
git commit -m "feat: 検索ページ未入力時に誘導文と最近再生した曲を表示"
```
