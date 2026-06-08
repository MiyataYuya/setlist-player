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
