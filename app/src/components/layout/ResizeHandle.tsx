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
    document.body.style.userSelect = "none";
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    setWidth(window.innerWidth - e.clientX);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    document.body.style.userSelect = "";
  };

  const handlePointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    document.body.style.userSelect = "";
  };

  // キー方向: ArrowLeft=右ペイン拡大(width+), ArrowRight=縮小(width-)。
  // aria-valuenow は右ペイン幅(px)。視覚マッピング（ハンドルを左へ＝右ペイン拡大）を優先した設計。
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
      aria-valuetext={`${width}px`}
      aria-valuemin={MIN_PLAYER_PANE_WIDTH}
      aria-valuemax={MAX_PLAYER_PANE_WIDTH}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
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
