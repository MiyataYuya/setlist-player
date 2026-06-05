# 中央↔右プレイヤー リサイズ用スプリッター Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** デスクトップの2ペインで、中央リストと右プレイヤーの境界をドラッグ／キーボードで動かして右ペイン幅を調整できるようにする（幅は localStorage に永続化）。

**Architecture:** 現行の「プレイヤーペインは1つの `Box` を `sx` で出し分ける」構造を保持し、中央 `Box` と右ペイン `Box` の間に自前の `ResizeHandle` を flex 兄弟として挿入する。右ペイン幅は永続化 Zustand ストア `layoutStore` が保持。`YouTubeEmbed` は移動しないので単一マウント（再生の非中断）は維持される。モバイルは不変。

**Tech Stack:** React 19, TypeScript, MUI v7 (`Box`, `sx`), Zustand v5 + `persist` ミドルウェア, Pointer Events, Vitest + @testing-library/react。

---

## 前提・共有知識（実装者向け）

- すべてのコマンドは `app/` ディレクトリで実行する（`vitest.config.ts` がそこにあるため。`Set-Location app;` を付ける。cwd は呼び出し間でリセットされる）。
- 永続化ストアの既存パターンは `src/stores/libraryStore.ts` を参照: `create<T>()(persist((set, get) => ({...}), { name: "karaoke-...", partialize }))`。
- テスト環境（jsdom）には Pointer Capture API（`setPointerCapture`/`releasePointerCapture`/`hasPointerCapture`）が無いので、`ResizeHandle` のテストでスタブする。
- 現行 `App.tsx` のデスクトップ右ペインは `width: 360` 固定（`src/App.tsx:108`）。中央 `Box` は `src/App.tsx:82-101`、右ペイン `Box` は `src/App.tsx:103-139`。
- 定数: `MIN_PLAYER_PANE_WIDTH = 320`、`MAX_PLAYER_PANE_WIDTH = 640`、既定 `360`、キーボード `STEP = 24`。
- キー操作の向き（設計準拠）: `ArrowLeft` で右ペイン拡大（ハンドルを左へ）、`ArrowRight` で縮小、`Home` で `MIN`、`End` で `MAX`。

## File Structure

| ファイル | 種別 | 責務 |
|---|---|---|
| `src/stores/layoutStore.ts` | 新規（永続化） | `playerPaneWidth` と `setPlayerPaneWidth`（クランプ）。定数 `MIN/MAX` を export |
| `src/stores/__tests__/layoutStore.test.ts` | 新規 | 既定・クランプ・setter のテスト |
| `src/components/layout/ResizeHandle.tsx` | 新規 | 境界のドラッグ/キーボードハンドル |
| `src/components/__tests__/ResizeHandle.test.tsx` | 新規 | a11y・キーボード・ポインタのテスト |
| `src/App.tsx` | 改修 | 右ペイン幅をストア連動にし、`ResizeHandle` を挿入（デスクトップのみ） |
| `src/components/__tests__/App.test.tsx` | 改修 | ハンドルの表示/非表示テストを追加 |

---

## Task 1: layoutStore（永続化・クランプ）

**Files:**
- Create: `src/stores/layoutStore.ts`
- Test: `src/stores/__tests__/layoutStore.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/stores/__tests__/layoutStore.test.ts`:

```ts
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
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `Set-Location app; npx vitest run src/stores/__tests__/layoutStore.test.ts`
Expected: FAIL（`layoutStore` が存在しない）

- [ ] **Step 3: layoutStore を実装**

`src/stores/layoutStore.ts`:

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MIN_PLAYER_PANE_WIDTH = 320;
export const MAX_PLAYER_PANE_WIDTH = 640;
const DEFAULT_PLAYER_PANE_WIDTH = 360;

function clampWidth(px: number): number {
  return Math.round(
    Math.min(MAX_PLAYER_PANE_WIDTH, Math.max(MIN_PLAYER_PANE_WIDTH, px))
  );
}

interface LayoutState {
  playerPaneWidth: number;
  setPlayerPaneWidth: (px: number) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      playerPaneWidth: DEFAULT_PLAYER_PANE_WIDTH,
      setPlayerPaneWidth: (px) => set({ playerPaneWidth: clampWidth(px) }),
    }),
    {
      name: "karaoke-layout",
      partialize: (s) => ({ playerPaneWidth: s.playerPaneWidth }),
    }
  )
);
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `Set-Location app; npx vitest run src/stores/__tests__/layoutStore.test.ts`
Expected: PASS（5件）

- [ ] **Step 5: コミット**

```bash
git add src/stores/layoutStore.ts src/stores/__tests__/layoutStore.test.ts
git commit -m "feat: 右ペイン幅を永続化する layoutStore を追加"
```

---

## Task 2: ResizeHandle コンポーネント

**Files:**
- Create: `src/components/layout/ResizeHandle.tsx`
- Test: `src/components/__tests__/ResizeHandle.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

`src/components/__tests__/ResizeHandle.test.tsx`:

```tsx
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
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.hasPointerCapture = () => true;
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
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `Set-Location app; npx vitest run src/components/__tests__/ResizeHandle.test.tsx`
Expected: FAIL（`ResizeHandle` が存在しない）

- [ ] **Step 3: ResizeHandle を実装**

`src/components/layout/ResizeHandle.tsx`:

```tsx
import Box from "@mui/material/Box";
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  useLayoutStore,
  MIN_PLAYER_PANE_WIDTH,
  MAX_PLAYER_PANE_WIDTH,
} from "../../stores/layoutStore";

const STEP = 24;

/**
 * 中央リストと右プレイヤーペインの境界に置くリサイズハンドル（デスクトップ専用）。
 * 右ペインは画面右端に密着しているため、幅 = window.innerWidth - clientX で算出する。
 * ハンドルを左へ動かす（clientX 減少）と右ペインが広がる。
 */
export default function ResizeHandle() {
  const width = useLayoutStore((s) => s.playerPaneWidth);
  const setWidth = useLayoutStore((s) => s.setPlayerPaneWidth);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    setWidth(window.innerWidth - e.clientX);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        setWidth(width + STEP);
        break;
      case "ArrowRight":
        e.preventDefault();
        setWidth(width - STEP);
        break;
      case "Home":
        e.preventDefault();
        setWidth(MIN_PLAYER_PANE_WIDTH);
        break;
      case "End":
        e.preventDefault();
        setWidth(MAX_PLAYER_PANE_WIDTH);
        break;
    }
  };

  return (
    <Box
      role="separator"
      aria-orientation="vertical"
      aria-label="プレイヤー幅の調整"
      aria-valuenow={width}
      aria-valuemin={MIN_PLAYER_PANE_WIDTH}
      aria-valuemax={MAX_PLAYER_PANE_WIDTH}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      sx={{
        flexShrink: 0,
        width: "6px",
        height: "100vh",
        cursor: "col-resize",
        bgcolor: "divider",
        touchAction: "none",
        transition: "background-color 150ms",
        outline: "none",
        "&:hover, &:focus-visible": {
          bgcolor: "primary.main",
        },
      }}
    />
  );
}
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `Set-Location app; npx vitest run src/components/__tests__/ResizeHandle.test.tsx`
Expected: PASS（5件）

- [ ] **Step 5: コミット**

```bash
git add src/components/layout/ResizeHandle.tsx src/components/__tests__/ResizeHandle.test.tsx
git commit -m "feat: 右ペイン幅を調整する ResizeHandle を追加"
```

---

## Task 3: App.tsx へ統合

**Files:**
- Modify: `src/App.tsx`
- Test: `src/components/__tests__/App.test.tsx`

- [ ] **Step 1: App テストにハンドル表示/非表示の検証を追加（失敗する）**

`src/components/__tests__/App.test.tsx` に、既存 `describe("App responsive shell", ...)` 内へ次の2テストを追加する（`screen`, `setMatchMedia`, `renderApp` は既存のものを利用）:

```tsx
it("shows the resize handle on desktop", () => {
  setMatchMedia(true);
  renderApp();
  expect(screen.getByRole("separator")).toBeInTheDocument();
});

it("does not show the resize handle on mobile", () => {
  setMatchMedia(false);
  renderApp();
  expect(screen.queryByRole("separator")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `Set-Location app; npx vitest run src/components/__tests__/App.test.tsx`
Expected: FAIL（まだハンドルが描画されていない。デスクトップのテストが `separator` を見つけられない）

- [ ] **Step 3: App.tsx を改修**

`src/App.tsx` に以下の3点を変更する。

(a) import を追加（既存の import 群の末尾付近、`useIsDesktop` の下）:

```tsx
import ResizeHandle from "./components/layout/ResizeHandle";
import { useLayoutStore } from "./stores/layoutStore";
```

(b) `AppContent` 内、`const isDesktop = useIsDesktop();` の直後に幅購読を追加:

```tsx
  const playerPaneWidth = useLayoutStore((s) => s.playerPaneWidth);
```

(c) 中央 `Box`（`</Box>` で閉じる、`FadeRoutes` を含むブロック）と `{showPlayerPane && (` の間に、デスクトップ用ハンドルを挿入する。さらにデスクトップ右ペインの `width: 360` を `width: playerPaneWidth` に変更する。

変更前（該当部分）:

```tsx
        </FadeRoutes>
      </Box>

      {showPlayerPane && (
        <Box
          sx={
            isDesktop
              ? {
                  width: 360,
                  flexShrink: 0,
```

変更後:

```tsx
        </FadeRoutes>
      </Box>

      {isDesktop && <ResizeHandle />}

      {showPlayerPane && (
        <Box
          sx={
            isDesktop
              ? {
                  width: playerPaneWidth,
                  flexShrink: 0,
```

他の箇所（モバイル分岐の sx、`YouTubeEmbed`、`PlayerBody`、`MiniPlayer`/`BottomNav`）は変更しない。

- [ ] **Step 4: テストを実行して成功を確認**

Run: `Set-Location app; npx vitest run src/components/__tests__/App.test.tsx`
Expected: PASS（既存 + 新規。デスクトップで `separator` 表示、モバイルで非表示）

- [ ] **Step 5: 全テストと型チェック**

Run: `Set-Location app; npx vitest run`
Expected: 全 PASS

Run: `Set-Location app; npm run build`
Expected: tsc 型エラーなし、Vite ビルド成功

- [ ] **Step 6: コミット**

```bash
git add src/App.tsx src/components/__tests__/App.test.tsx
git commit -m "feat: 中央↔右ペインのリサイズハンドルを App に統合（幅はストア連動）"
```

---

## Task 4: 手動確認

**Files:** なし（動作確認のみ）

- [ ] **Step 1: dev サーバーで確認**

Run: `Set-Location app; npm run dev`

確認項目（ウィンドウ幅 ≥ 1200px）:
- 中央リストと右ペインの境界にハンドルが見え、`col-resize` カーソルになる
- 左右にドラッグすると右ペイン幅が 320〜640px の範囲で変わる
- ハンドルにフォーカスして ←/→ で幅が 24px ずつ変わり、Home で最小・End で最大になる
- **ドラッグ中も再生は途切れない**（同じ動画・同じ再生位置を維持）
- ページをリロードしても調整した幅が復元される
- ウィンドウ幅 < 1200px ではハンドルが消え、従来のモバイル表示になる

- [ ] **Step 2: 確認結果を報告**（コミット不要）

---

## Self-Review チェック結果

- **Spec coverage:**
  - デスクトップ限定スプリッター → Task 3（`{isDesktop && <ResizeHandle />}`）✅
  - 単一マウント維持（現構造保持、ハンドルは兄弟挿入のみ）→ Task 3 ✅
  - 永続化（localStorage `karaoke-layout`）→ Task 1 ✅
  - クランプ 320/640 → Task 1 ✅
  - ポインタ + キーボード a11y（role/aria/Arrow/Home/End）→ Task 2 ✅
  - モバイル不変 → Task 3（モバイル分岐は無変更、ハンドルは `isDesktop` ガード）✅
  - 既存テスト不変 + 新規テスト → 各タスク ✅
- **Placeholder scan:** TBD/TODO なし。各コードステップに実コードあり。✅
- **Type consistency:** `playerPaneWidth: number` / `setPlayerPaneWidth(px: number)` / `MIN_PLAYER_PANE_WIDTH` / `MAX_PLAYER_PANE_WIDTH` は Task 1 定義、Task 2・3 使用で一致。`ResizeHandle` は default export、Task 3 で default import。✅
