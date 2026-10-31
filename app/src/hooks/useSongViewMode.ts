import { useLayoutStore } from "../stores/layoutStore";
import { useIsDesktop } from "./useIsDesktop";
import type { SongViewMode } from "../stores/layoutStore";

/**
 * 曲の並べ方を返す。ユーザーが明示的に選んでいればそれを、
 * 未設定なら画面幅から決める（PC=タイル / モバイル=リスト）。
 */
export function useSongViewMode(): SongViewMode {
  const stored = useLayoutStore((s) => s.songViewMode);
  const isDesktop = useIsDesktop();

  return stored ?? (isDesktop ? "tile" : "list");
}
