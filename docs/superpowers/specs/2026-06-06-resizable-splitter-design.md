# 中央↔右プレイヤー リサイズ用スプリッター 設計

- 日付: 2026-06-06
- 対象: `app/`（React 19 + Vite + MUI v7 + Zustand）
- 前提: [PCレスポンシブ2ペイン](2026-06-06-pc-responsive-layout-design.md) の上に積む
- ステータス: 設計合意済み

## 背景・目的

PCレスポンシブ化で導入した2ペイン（中央リスト＋右常設プレイヤー）の右ペイン幅が `360px` 固定になっている。利用者が中央と右の幅を好みに調整できるよう、境界にドラッグ可能なスプリッター（WPF の GridSplitter 相当）を追加する。

## 方針

- **デスクトップ限定**。モバイル（オーバーレイ式再生画面）は完全に不変。
- 現行の「プレイヤーペインは1つの `Box` で、`sx` をブレークポイントで出し分ける」構造を保持する。スプリッターは中央 `Box` と右ペイン `Box` の**間に挟むだけ**。これにより `YouTubeEmbed` のツリー上の位置は変わらず、**単一マウント（再生の非中断）が維持**される。
- ライブラリ（react-resizable-panels 等）は不採用。理由: それらはデスクトップを `Group/Panel` 構造へ置き換えるため、モバイルのオーバーレイ構造と非対称になり、単一マウント維持に固定ホスト＋実測追従という重い実装が必要になる（かつモバイルのスライド演出と競合する）。自前スプリッターは現構造を保てて最も素直。
- 右ペイン幅は **Zustand の永続化ストア**で保持し、リロード後も復元する（既存ストアと同じ `persist` パターン、localStorage）。

## コンポーネント / ファイル

| ファイル | 種別 | 責務 |
|---|---|---|
| `src/stores/layoutStore.ts` | 新規（永続化） | `playerPaneWidth: number`（既定 360）と `setPlayerPaneWidth(px)`。`[MIN_PLAYER_PANE_WIDTH=320, MAX_PLAYER_PANE_WIDTH=640]` でクランプ。`persist` キー `karaoke-layout`、`partialize` で `playerPaneWidth` のみ保存 |
| `src/components/layout/ResizeHandle.tsx` | 新規 | 中央と右ペインの境界に置く幅6pxの縦ハンドル。ポインタドラッグとキーボードで `setPlayerPaneWidth` を呼ぶ |
| `src/App.tsx` | 改修 | デスクトップ右ペインの `width` を `playerPaneWidth` に変更。中央 `Box` と右ペイン `Box` の間に `<ResizeHandle />` を描画（デスクトップかつ `showPlayerPane` のとき）。モバイル分岐は不変 |
| `src/stores/__tests__/layoutStore.test.ts` | 新規 | クランプ・永続化のテスト |
| `src/components/__tests__/ResizeHandle.test.tsx` | 新規 | a11y 属性・キーボード・ポインタドラッグのテスト |
| `src/components/__tests__/App.test.tsx` | 改修 | ハンドルのデスクトップ表示／モバイル非表示、ペイン幅がストア連動 |

## ResizeHandle の仕様

- 見た目: 幅 `6px`、`height: 100vh`、`cursor: "col-resize"`、ホバー/ドラッグ時に色を強調。中央 `Box` と 右ペイン `Box` の間に flex 要素として配置。
- アクセシビリティ: `role="separator"`、`aria-orientation="vertical"`、`aria-valuenow={playerPaneWidth}`、`aria-valuemin={MIN}`、`aria-valuemax={MAX}`、`tabIndex={0}`、`aria-label="プレイヤー幅の調整"`。
- ポインタ操作: `onPointerDown` で `setPointerCapture`、`onPointerMove` 中に `幅 = window.innerWidth - e.clientX` を算出して `setPlayerPaneWidth`（ストア側でクランプ）。右ペインは画面右端に密着しているため右端基準で算出。`onPointerUp`/`onLostPointerCapture` で解放。ドラッグ中は `body` のテキスト選択を抑止。
- キーボード操作: フォーカス時に `ArrowLeft`/`ArrowRight` で ±`STEP=24px`、`Home` で `MIN`、`End` で `MAX`。`preventDefault` でページスクロールを抑止。
- 幅の向き: ハンドルを左へ動かす（`clientX` が小さくなる）と右ペインが広がる。

## クランプとウィンドウ幅

- ストアの `setPlayerPaneWidth` は常に `[320, 640]` にクランプする。
- 最小デスクトップ幅 1200px、サイドナビ 220px、右ペイン最大 640px のとき中央に約 340px 残るため、実用上問題ない。ウィンドウ幅に応じた動的上限は導入しない（YAGNI）。

## 状態・データフロー

- `layoutStore` はレイアウト設定のみを持つ独立ストア。`playerStore` 等とは無関係。
- `App.tsx` は `useLayoutStore((s) => s.playerPaneWidth)` を購読し、右ペイン `Box` の `width` に渡す。`ResizeHandle` は同ストアの setter を呼ぶ。
- モバイル分岐（fixed オーバーレイ、`translateY` スライド、`MiniPlayer`/`BottomNav`）は一切変更しない。

## テスト方針（TDD）

- `layoutStore`: 既定値、クランプ（下限未満→`MIN`、上限超→`MAX`）、`setPlayerPaneWidth` の反映。永続化は localStorage モック（既存 setup）で確認。
- `ResizeHandle`: `role="separator"` と aria 値の描画、キーボード（`ArrowLeft`/`ArrowRight`/`Home`/`End`）でストア更新、`fireEvent.pointerDown` → `pointerMove({clientX})` → `pointerUp` でストア幅が更新されること。jsdom に無い `setPointerCapture`/`releasePointerCapture` はテスト用にスタブ。
- `App`: デスクトップ（`setMatchMedia(true)`）で `role="separator"` が存在、モバイル（`setMatchMedia(false)`）で非存在。右ペイン幅がストア値に連動。
- 既存テストはすべて不変で通ること。

## 非対象（YAGNI）

- ダブルクリックでデフォルト幅にリセット、スナップ、折りたたみは実装しない。
- 縦方向（動画とキューの間）のリサイズは対象外。
- ウィンドウ幅連動の動的上限は導入しない。
