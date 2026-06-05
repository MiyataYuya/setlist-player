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
