# PC レスポンシブレイアウト Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** モバイルファーストの単一カラム SPA を、PC幅（lg ≈ 1200px以上）で「左サイドナビ＋中央一覧＋右常設プレイヤー」の2ペイン構成にする。モバイル挙動は不変。

**Architecture:** レイアウトを別シェルに二分岐せず、**単一のコンポーネントツリーを MUI の `sx` レスポンシブ（`{ xs, lg }`）で変形**する。これにより `YouTubeEmbed`（実 iframe）はツリー上の1箇所にしか存在せず、ウィンドウ幅がしきい値をまたいでも再マウントされない＝再生が途切れない（設計の単一マウント制約を自然に満たす）。再生画面の中身は `PlayerBody` に切り出し、モバイルのスライドオーバーレイと PC の右カラムで共有する。

**Tech Stack:** React 19, TypeScript, Vite, MUI v7（`useMediaQuery`, `sx` responsive, Drawer/List）, Zustand v5, Vitest + @testing-library/react, jsdom。

---

## 前提・共有知識（実装者向け）

- すべてのコマンドは `app/` ディレクトリで実行する。
- 単一テスト実行: `npx vitest run src/path/to/file.test.tsx`
- 既存の再生画面 `src/components/player/PlayerScreen.tsx` は「閉じるボタン＋曲情報＋シーク＋コントロール＋キュー」。本計画でこの中身を `PlayerBody.tsx` に移し、`PlayerScreen.tsx` は廃止する（`App.tsx` 以外から参照されていないことを確認済み）。
- `App.tsx` の現状: `currentSong` がある間だけ `position:fixed` のオーバーレイ Box（`translateY` でスライド）の中に `<YouTubeEmbed />` と `<PlayerScreen />` を置いている。`MiniPlayer` と `BottomNav` は常時マウント。
- テスト環境（jsdom）には `window.matchMedia` が無い。Task 1 で setup に追加する。
- MUI の `useMediaQuery(theme.breakpoints.up('lg'))` は `matchMedia` の `matches` を読む。テストでは `matchMedia` を差し替えて制御する。
- ブレークポイント: `lg`（MUI デフォルト 1200px）以上を「デスクトップ」とする。

## File Structure

| ファイル | 種別 | 責務 |
|---|---|---|
| `src/test/setup.ts` | 改修 | `window.matchMedia` モック追加 |
| `src/test/helpers.tsx` | 改修 | `setMatchMedia(isDesktop)` ヘルパー追加 |
| `src/hooks/useIsDesktop.ts` | 新規 | `useMediaQuery(up('lg'))` をラップした PC幅判定フック |
| `src/hooks/__tests__/useIsDesktop.test.tsx` | 新規 | 上記のテスト |
| `src/components/layout/navItems.tsx` | 新規 | ナビ3項目（ラベル/アイコン/パス）の共有定義 |
| `src/components/layout/BottomNav.tsx` | 改修 | `navItems` を参照（挙動不変） |
| `src/components/layout/SideNav.tsx` | 新規 | PC用 左サイドナビ（縦・ラベル付き） |
| `src/components/__tests__/SideNav.test.tsx` | 新規 | 上記のテスト |
| `src/components/player/PlayerBody.tsx` | 新規 | 曲情報〜キュー。`variant: 'overlay' \| 'panel'` |
| `src/components/__tests__/PlayerBody.test.tsx` | 新規 | 上記のテスト |
| `src/components/player/PlayerScreen.tsx` | 削除 | `PlayerBody` に統合 |
| `src/App.tsx` | 改修 | flexレイアウト・レスポンシブ配置・出し分け・単一 `YouTubeEmbed` |
| `src/components/__tests__/App.test.tsx` | 新規 | デスクトップ/モバイルの出し分け検証 |

---

## Task 1: matchMedia テストモックと useIsDesktop フック

**Files:**
- Modify: `src/test/setup.ts`
- Modify: `src/test/helpers.tsx`
- Create: `src/hooks/useIsDesktop.ts`
- Test: `src/hooks/__tests__/useIsDesktop.test.tsx`

- [ ] **Step 1: setup.ts に matchMedia モックを追加**

`src/test/setup.ts` の末尾（localStorage モックの後）に追記:

```ts
// Mock matchMedia（デフォルトは「マッチしない」= モバイル幅扱い）
// テストごとに helpers の setMatchMedia() で上書きする。
Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});
```

- [ ] **Step 2: helpers.tsx に setMatchMedia ヘルパーを追加**

`src/test/helpers.tsx` の末尾（`export { default as userEvent ... }` の前）に追記:

```tsx
/**
 * useMediaQuery 用に matchMedia を差し替える。
 * isDesktop=true なら min-width 系クエリ（lg以上）を true にする。
 */
export function setMatchMedia(isDesktop: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: isDesktop && query.includes("min-width"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
```

- [ ] **Step 3: useIsDesktop のテストを書く（失敗する）**

`src/hooks/__tests__/useIsDesktop.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { setMatchMedia } from "../../test/helpers";
import { useIsDesktop } from "../useIsDesktop";

const theme = createTheme();
const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe("useIsDesktop", () => {
  it("returns true when viewport is desktop width (lg+)", () => {
    setMatchMedia(true);
    const { result } = renderHook(() => useIsDesktop(), { wrapper });
    expect(result.current).toBe(true);
  });

  it("returns false when viewport is mobile width", () => {
    setMatchMedia(false);
    const { result } = renderHook(() => useIsDesktop(), { wrapper });
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 4: テストを実行して失敗を確認**

Run: `npx vitest run src/hooks/__tests__/useIsDesktop.test.tsx`
Expected: FAIL（`useIsDesktop` が存在しない / import エラー）

- [ ] **Step 5: useIsDesktop を実装**

`src/hooks/useIsDesktop.ts`:

```ts
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

/**
 * PC幅（lg ブレークポイント以上 ≈ 1200px）かどうかを返す。
 * モバイル/タブレット縦は false。
 */
export function useIsDesktop(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up("lg"));
}
```

- [ ] **Step 6: テストを実行して成功を確認**

Run: `npx vitest run src/hooks/__tests__/useIsDesktop.test.tsx`
Expected: PASS（2件）

- [ ] **Step 7: コミット**

```bash
git add src/test/setup.ts src/test/helpers.tsx src/hooks/useIsDesktop.ts src/hooks/__tests__/useIsDesktop.test.tsx
git commit -m "feat: PC幅判定フック useIsDesktop と matchMedia テストモックを追加"
```

---

## Task 2: ナビ項目の共有定義（navItems）

**Files:**
- Create: `src/components/layout/navItems.tsx`
- Modify: `src/components/layout/BottomNav.tsx`

理由: ナビ3項目を `BottomNav` と `SideNav` で重複定義しないため（DRY）。`BottomNav` の挙動は不変。

- [ ] **Step 1: navItems.tsx を作成**

`src/components/layout/navItems.tsx`:

```tsx
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "ホーム", icon: <HomeIcon />, path: "/" },
  { label: "検索", icon: <SearchIcon />, path: "/search" },
  { label: "ライブラリ", icon: <LibraryMusicIcon />, path: "/library" },
];
```

- [ ] **Step 2: BottomNav.tsx を navItems 参照に変更**

`src/components/layout/BottomNav.tsx` の冒頭のアイコン import 群とローカル `NAV_ITEMS` 定義（1〜14行目相当）を削除し、共有 import に置き換える。

変更前（削除する部分）:

```tsx
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlayerStore } from "../../stores/playerStore";

const NAV_ITEMS = [
  { label: "ホーム", icon: <HomeIcon />, path: "/" },
  { label: "検索", icon: <SearchIcon />, path: "/search" },
  { label: "ライブラリ", icon: <LibraryMusicIcon />, path: "/library" },
];
```

変更後:

```tsx
import { useLocation, useNavigate } from "react-router-dom";
import { usePlayerStore } from "../../stores/playerStore";
import { NAV_ITEMS } from "./navItems";
```

（`BottomNavigation`/`BottomNavigationAction`/`Paper` の import と関数本体はそのまま残す。）

- [ ] **Step 3: 既存 BottomNav テストが通ることを確認**

Run: `npx vitest run src/components/__tests__/BottomNav.test.tsx`
Expected: PASS（既存2件。ラベル・アクティブ表示は不変）

- [ ] **Step 4: コミット**

```bash
git add src/components/layout/navItems.tsx src/components/layout/BottomNav.tsx
git commit -m "refactor: ナビ項目定義を navItems.tsx に共有化"
```

---

## Task 3: SideNav（PC用 左サイドナビ）

**Files:**
- Create: `src/components/layout/SideNav.tsx`
- Test: `src/components/__tests__/SideNav.test.tsx`

挙動: `BottomNav` と同じ3項目を縦に表示。クリックで遷移し、再生画面オーバーレイが開いていれば閉じる（`BottomNav` と同じく `closePlayer`）。現在ルートをハイライト。

- [ ] **Step 1: SideNav のテストを書く（失敗する）**

`src/components/__tests__/SideNav.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { renderWithRoute, screen, userEvent } from "../../test/helpers";
import SideNav from "../layout/SideNav";

describe("SideNav", () => {
  it("displays 3 nav items: ホーム, 検索, ライブラリ", () => {
    renderWithRoute(<SideNav />, ["/"]);
    expect(screen.getByText("ホーム")).toBeInTheDocument();
    expect(screen.getByText("検索")).toBeInTheDocument();
    expect(screen.getByText("ライブラリ")).toBeInTheDocument();
  });

  it("marks the current route item as selected", () => {
    renderWithRoute(<SideNav />, ["/search"]);
    const searchItem = screen.getByText("検索").closest("a, [role='button'], li, div");
    expect(searchItem?.className).toMatch(/selected|Mui-selected/);
  });

  it("navigates when an item is clicked", async () => {
    const user = userEvent.setup();
    renderWithRoute(<SideNav />, ["/"]);
    await user.click(screen.getByText("ライブラリ"));
    // クリック後、ライブラリ項目が選択状態になる
    const libItem = screen.getByText("ライブラリ").closest("a, [role='button'], li, div");
    expect(libItem?.className).toMatch(/selected|Mui-selected/);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx vitest run src/components/__tests__/SideNav.test.tsx`
Expected: FAIL（`SideNav` が存在しない）

- [ ] **Step 3: SideNav を実装**

`src/components/layout/SideNav.tsx`:

```tsx
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlayerStore } from "../../stores/playerStore";
import { NAV_ITEMS } from "./navItems";

export default function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (path: string) => {
    if (usePlayerStore.getState().isPlayerOpen) {
      usePlayerStore.getState().closePlayer();
    }
    navigate(path);
  };

  return (
    <Box
      component="nav"
      sx={{
        width: 220,
        flexShrink: 0,
        height: "100vh",
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        position: "sticky",
        top: 0,
        py: 2,
      }}
    >
      <Typography variant="h6" sx={{ px: 3, pb: 2, fontWeight: 700 }}>
        セトリプレイヤー
      </Typography>
      <List>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => handleClick(item.path)}
            sx={{ borderRadius: 2, mx: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx vitest run src/components/__tests__/SideNav.test.tsx`
Expected: PASS（3件）

- [ ] **Step 5: コミット**

```bash
git add src/components/layout/SideNav.tsx src/components/__tests__/SideNav.test.tsx
git commit -m "feat: PC用の左サイドナビ SideNav を追加"
```

---

## Task 4: PlayerBody（再生画面の中身を共有化）

**Files:**
- Create: `src/components/player/PlayerBody.tsx`
- Test: `src/components/__tests__/PlayerBody.test.tsx`
- Delete: `src/components/player/PlayerScreen.tsx`（Task 5 で App から参照を外した後に削除）

`variant` prop:
- `'overlay'`（モバイル）: 上部に閉じるボタン（`window.history.back()`）。現 `PlayerScreen` と同一見た目。
- `'panel'`（PC右カラム）: 閉じるボタンなし。

挙動は現 `PlayerScreen` をそのまま移植し、閉じるボタンだけ `variant` で出し分ける。曲情報・お気に入り・タグ・シーク・コントロール・キューは不変。

- [ ] **Step 1: PlayerBody のテストを書く（失敗する）**

`src/components/__tests__/PlayerBody.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen } from "../../test/helpers";
import PlayerBody from "../player/PlayerBody";
import { usePlayerStore } from "../../stores/playerStore";
import { songPerformances } from "../../data/songs";

const sample = songPerformances[0];

describe("PlayerBody", () => {
  beforeEach(() => {
    usePlayerStore.getState().playSong(sample, [sample]);
  });

  it("renders the current song title", () => {
    renderWithProviders(<PlayerBody variant="overlay" />);
    expect(screen.getByText(sample.title)).toBeInTheDocument();
  });

  it("shows a close button in overlay variant", () => {
    renderWithProviders(<PlayerBody variant="overlay" />);
    expect(screen.getByTestId("player-close")).toBeInTheDocument();
  });

  it("does not show a close button in panel variant", () => {
    renderWithProviders(<PlayerBody variant="panel" />);
    expect(screen.queryByTestId("player-close")).not.toBeInTheDocument();
  });
});
```

> 注: `songPerformances` はテスト時 `src/test/__mocks__/` のモックデータに解決される（`vitest.config.ts` の alias）。最低1件存在する前提。モックが空の場合は Task 実行前にモックデータへ1件追加すること。

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx vitest run src/components/__tests__/PlayerBody.test.tsx`
Expected: FAIL（`PlayerBody` が存在しない）

- [ ] **Step 3: PlayerBody を実装**

`src/components/player/PlayerBody.tsx`（現 `PlayerScreen.tsx` の内容をベースに、閉じるボタンを `variant` で出し分け、閉じるボタンに `data-testid="player-close"` を付与）:

```tsx
import { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import LabelIcon from "@mui/icons-material/Label";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import PlayerControls from "./PlayerControls";
import SeekBar from "./SeekBar";
import FavoriteButton from "../common/FavoriteButton";
import TagManager from "../songs/TagManager";
import { usePlayerStore, useCurrentSong } from "../../stores/playerStore";

interface PlayerBodyProps {
  variant: "overlay" | "panel";
}

export default function PlayerBody({ variant }: PlayerBodyProps) {
  const currentSong = useCurrentSong();
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const playSong = usePlayerStore((s) => s.playSong);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const currentItemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [currentIndex]);

  if (!currentSong) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          minHeight: variant === "panel" ? 200 : "80vh",
        }}
      >
        <Typography color="text.secondary">曲を選択してください</Typography>
      </Box>
    );
  }

  const date = currentSong.publishedAt
    ? new Date(currentSong.publishedAt).toLocaleDateString("ja-JP")
    : "";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overscrollBehavior: "none",
      }}
    >
      {variant === "overlay" && (
        <IconButton
          data-testid="player-close"
          onClick={() => window.history.back()}
          sx={{ alignSelf: "flex-start", ml: 1, mt: 0.5 }}
        >
          <KeyboardArrowDownIcon />
        </IconButton>
      )}

      {/* 曲情報 */}
      <Box sx={{ px: 3, pt: variant === "panel" ? 2 : 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" fontWeight="bold" noWrap lineHeight={1.3}>
              {currentSong.title}
            </Typography>
            {currentSong.artist && (
              <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
                {currentSong.artist}
              </Typography>
            )}
            {date && (
              <Typography variant="caption" color="text.secondary">
                {date}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
            <FavoriteButton performanceId={currentSong.performanceId} />
            <IconButton size="small" onClick={() => setTagManagerOpen(true)}>
              <LabelIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <TagManager
          open={tagManagerOpen}
          onClose={() => setTagManagerOpen(false)}
          performanceId={currentSong.performanceId}
        />
      </Box>

      {/* シークバー + コントロール */}
      <Box sx={{ px: 3, pt: 1 }}>
        <SeekBar />
        <Box sx={{ mt: 0.5 }}>
          <PlayerControls />
        </Box>
      </Box>

      {/* キュー */}
      {queue.length > 0 && (
        <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", mt: 1 }}>
          <Box sx={{ px: 3, display: "flex", alignItems: "center", gap: 0.5 }}>
            <QueueMusicIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              キュー ({queue.length})
            </Typography>
          </Box>
          <List
            dense
            disablePadding
            sx={{
              flex: 1,
              overflowY: "auto",
              overscrollBehavior: "contain",
              px: 1,
              "&::-webkit-scrollbar": { width: 0 },
            }}
          >
            {queue.map((song, i) => {
              const isCurrent = i === currentIndex;
              const isPlayed = i < currentIndex;
              return (
                <ListItemButton
                  key={`${song.performanceId}-${i}`}
                  ref={isCurrent ? currentItemRef : undefined}
                  onClick={() => playSong(song, queue)}
                  sx={{
                    borderRadius: 1,
                    py: 0.5,
                    px: 2,
                    minHeight: 0,
                    opacity: isPlayed ? 0.45 : 1,
                    bgcolor: isCurrent ? "action.selected" : "transparent",
                  }}
                >
                  <Typography
                    variant="caption"
                    color={isCurrent ? "primary" : "text.secondary"}
                    sx={{ width: 20, flexShrink: 0 }}
                  >
                    {i + 1}
                  </Typography>
                  <ListItemText
                    primary={song.title}
                    secondary={song.artist}
                    primaryTypographyProps={{
                      variant: "body2",
                      noWrap: true,
                      lineHeight: 1.3,
                      color: isCurrent ? "primary" : "text.primary",
                      fontWeight: isCurrent ? 700 : 400,
                    }}
                    secondaryTypographyProps={{
                      variant: "caption",
                      noWrap: true,
                    }}
                    sx={{ my: 0 }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx vitest run src/components/__tests__/PlayerBody.test.tsx`
Expected: PASS（3件）

- [ ] **Step 5: コミット**

```bash
git add src/components/player/PlayerBody.tsx src/components/__tests__/PlayerBody.test.tsx
git commit -m "feat: 再生画面の中身を PlayerBody に切り出し（variant対応）"
```

---

## Task 5: App.tsx をレスポンシブ2ペインに改修

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/components/player/PlayerScreen.tsx`
- Test: `src/components/__tests__/App.test.tsx`

設計の核。レイアウトを `display:flex` の横並びにし、左に `SideNav`（lgのみ）、中央に `Routes`、右に「プレイヤーペイン」を置く。プレイヤーペインのコンテナは `sx` レスポンシブで、**モバイルでは fixed オーバーレイ（translateYスライド）／PCでは右カラム（in-flow）**に切り替える。`YouTubeEmbed` はこのコンテナ内に1回だけマウントする。

- [ ] **Step 1: App のテストを書く（失敗する）**

`src/components/__tests__/App.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { screen, setMatchMedia } from "../../test/helpers";
import theme from "../../theme";
import App from "../../App";

function renderApp() {
  return render(
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
}

describe("App responsive shell", () => {
  it("shows SideNav and hides BottomNav on desktop", () => {
    setMatchMedia(true);
    renderApp();
    // SideNav にはタイトルがある
    expect(screen.getByText("セトリプレイヤー")).toBeInTheDocument();
    // BottomNav（MuiBottomNavigation）は描画されない
    expect(document.querySelector(".MuiBottomNavigation-root")).toBeNull();
  });

  it("shows BottomNav and hides SideNav on mobile", () => {
    setMatchMedia(false);
    renderApp();
    expect(document.querySelector(".MuiBottomNavigation-root")).not.toBeNull();
    expect(screen.queryByText("セトリプレイヤー")).not.toBeInTheDocument();
  });
});
```

> 注: `App` 内に `BrowserRouter` が含まれるため、テストでは `MemoryRouter` を別途包まない。`setMatchMedia` は render 前に呼ぶ。

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx vitest run src/components/__tests__/App.test.tsx`
Expected: FAIL（現状の App はレスポンシブ分岐を持たない）

- [ ] **Step 3: App.tsx を実装**

`src/App.tsx` を以下に置き換える。`FadeRoutes` はそのまま流用。`isDesktop` を `useIsDesktop()` で取得し、ナビ/プレイヤーペインを出し分ける。

```tsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import BottomNav from "./components/layout/BottomNav";
import SideNav from "./components/layout/SideNav";
import MiniPlayer from "./components/layout/MiniPlayer";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import LibraryPage from "./pages/LibraryPage";
import PlayerBody from "./components/player/PlayerBody";
import PlaylistPage from "./pages/PlaylistPage";
import YouTubeEmbed from "./components/player/YouTubeEmbed";
import { useCurrentSong, usePlayerStore } from "./stores/playerStore";
import { useIsDesktop } from "./hooks/useIsDesktop";
import { useState, useEffect, useRef } from "react";

function FadeRoutes({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [fadeIn, setFadeIn] = useState(true);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname;
      setFadeIn(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setFadeIn(true));
      });
    }
  }, [location.pathname]);

  return (
    <Box
      sx={{
        opacity: fadeIn ? 1 : 0,
        transition: fadeIn ? "opacity 200ms ease-in" : "none",
      }}
    >
      {children}
    </Box>
  );
}

function AppContent() {
  const currentSong = useCurrentSong();
  const isPlayerOpen = usePlayerStore((s) => s.isPlayerOpen);
  const isDesktop = useIsDesktop();

  // ブラウザバックで再生画面を閉じる（モバイルのオーバーレイのみ）
  useEffect(() => {
    if (isPlayerOpen && !isDesktop) {
      window.history.pushState({ playerOpen: true }, "");
    }
  }, [isPlayerOpen, isDesktop]);

  useEffect(() => {
    const handlePopState = () => {
      if (usePlayerStore.getState().isPlayerOpen) {
        usePlayerStore.getState().closePlayer();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // PCでは右カラムを常設（曲未選択でも枠を出す）。モバイルでは曲がある時だけオーバーレイをマウント。
  const showPlayerPane = isDesktop || currentSong != null;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {isDesktop && <SideNav />}

      {/* 中央: 一覧 */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          height: isDesktop ? "100vh" : "auto",
          overflowY: isDesktop ? "auto" : "visible",
          pb: isDesktop
            ? 2
            : "calc(120px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <FadeRoutes>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
          </Routes>
        </FadeRoutes>
      </Box>

      {/* プレイヤーペイン: PC=右カラム固定 / モバイル=下からスライドするオーバーレイ */}
      {showPlayerPane && (
        <Box
          sx={
            isDesktop
              ? {
                  width: 360,
                  flexShrink: 0,
                  height: "100vh",
                  borderLeft: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.default",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }
              : {
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: "calc(56px + env(safe-area-inset-bottom, 0px))",
                  zIndex: 1100,
                  transform: isPlayerOpen
                    ? "translateY(0)"
                    : "translateY(100%)",
                  transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                  bgcolor: "background.default",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }
          }
        >
          <YouTubeEmbed />
          <PlayerBody variant={isDesktop ? "panel" : "overlay"} />
        </Box>
      )}

      {/* モバイル専用 */}
      {!isDesktop && <MiniPlayer />}
      {!isDesktop && <BottomNav />}
    </Box>
  );
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
```

> 単一マウントの担保: `YouTubeEmbed` はこの1箇所にしか書かれていない。`isDesktop` の切替で `showPlayerPane` の Box は再評価されるが、`YouTubeEmbed` 要素自身は同じ親の同じ位置にとどまるため React は再マウントしない（リサイズで再生が途切れない）。`currentSong` が無い間 `YouTubeEmbed` は `null` を返す（既存仕様）。

- [ ] **Step 4: PlayerScreen.tsx を削除**

`src/components/player/PlayerScreen.tsx` は `App.tsx` から参照されなくなった。他からの参照が無いことを確認して削除する。

Run（参照が無いことを確認）: `npx grep -r "PlayerScreen" src/ || rg "PlayerScreen" src/`
Expected: ヒット無し（または本ファイル自身のみ）

削除:
```bash
git rm src/components/player/PlayerScreen.tsx
```

- [ ] **Step 5: App テストと全テストを実行**

Run: `npx vitest run src/components/__tests__/App.test.tsx`
Expected: PASS（2件）

Run: `npx vitest run`
Expected: 全 PASS（既存テスト含む。`PlayerScreen` 参照エラーが無いこと）

- [ ] **Step 6: 型チェック**

Run: `npm run build`
Expected: tsc 型エラー無し、Vite ビルド成功

- [ ] **Step 7: コミット**

```bash
git add src/App.tsx src/components/__tests__/App.test.tsx
git rm src/components/player/PlayerScreen.tsx
git commit -m "feat: PC幅で左ナビ＋右常設プレイヤーの2ペインに（単一iframe維持）"
```

---

## Task 6: 仕上げ（手動確認とドキュメント追記）

**Files:**
- Modify: `CLAUDE.md`（Architecture セクションにレスポンシブ方針を1〜2行追記）

- [ ] **Step 1: 開発サーバーで手動確認**

Run: `npm run dev`

確認項目（ブラウザ幅を変えて検証）:
- ウィンドウ幅 ≥ 1200px: 左サイドナビ＋中央一覧＋右パネル（動画/曲情報/シーク/コントロール/キュー）が表示される。下部ナビ・ミニプレイヤーは出ない。
- ウィンドウ幅 < 1200px: 従来どおり下部ナビ＋ミニプレイヤー、再生画面は下からスライド。
- **再生中にウィンドウ幅を 1200px の前後でまたいでも、動画の再生が途切れない**（単一iframe維持の検証）。
- PCで曲未選択時、右パネルに「曲を選択してください」が出る。

- [ ] **Step 2: E2E が壊れていないか確認**

Run: `npm run test:e2e`
Expected: 既存 E2E が PASS（モバイル相当のビューポートで動作するもの。失敗する場合は Playwright のビューポート設定を確認し、モバイル幅で実行されていることを確かめる）

- [ ] **Step 3: CLAUDE.md にレスポンシブ方針を追記**

`CLAUDE.md` の「### ルーティング」または「### UIスタイリング」付近に追記:

```markdown
### レスポンシブ

`useIsDesktop()`（`lg` ≈ 1200px以上）で PC 幅を判定。PCでは `App.tsx` が `SideNav`（左）＋一覧（中央）＋プレイヤーペイン（右常設、`PlayerBody variant="panel"`）の2ペインを表示し、`BottomNav`/`MiniPlayer` は非表示。モバイルは従来どおり下部ナビ＋スライド式オーバーレイ（`PlayerBody variant="overlay"`）。`YouTubeEmbed` は `App.tsx` 内に単一マウントし、幅変更でも再生が途切れない。
```

- [ ] **Step 4: コミット**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md にレスポンシブ方針を追記"
```

---

## Self-Review チェック結果

- **Spec coverage:**
  - 2ペイン構成（左ナビ/中央/右パネル）→ Task 3, 5 ✅
  - しきい値 lg → Task 1（useIsDesktop）✅
  - PlayerBody 共有化 → Task 4 ✅
  - 単一 iframe 維持 → Task 5（単一ツリー＋sx分岐で実現。設計の「別シェル＋fixed座標」案より堅牢な代替）✅
  - MiniPlayer/BottomNav の PC非表示 → Task 5 ✅
  - isPlayerOpen はモバイル専用 → Task 5（`!isDesktop` ガード）✅
  - navItems 共有 → Task 2 ✅
  - テスト（既存不変＋新規）→ 各タスク ✅
- **設計との差分:** 設計ドキュメントは `DesktopShell`/`DesktopPlayerPanel`/`fixed座標切替` を挙げていたが、本計画では同一目的（単一マウント）をより堅牢に満たす「単一ツリー＋レスポンシブ sx」で実装する。コンポーネントは `SideNav` + `PlayerBody`(variant) + `App.tsx` のレスポンシブ sx に集約。
- **Placeholder scan:** TBD/TODO 無し。各コードステップに実コードあり。✅
- **Type consistency:** `PlayerBody` の `variant: 'overlay' | 'panel'` は Task 4 定義・Task 5 使用で一致。`useIsDesktop(): boolean` は Task 1 定義・Task 5 使用で一致。`NAV_ITEMS`/`NavItem` は Task 2 定義・Task 3 使用で一致。✅
