import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import type { ReactElement, ReactNode } from "react";

const theme = createTheme({ palette: { mode: "dark" } });

function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <MemoryRouter>{children}</MemoryRouter>
    </ThemeProvider>
  );
}

function ProvidersWithRoute({ children, initialEntries }: { children: ReactNode; initialEntries: string[] }) {
  return (
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </ThemeProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: Providers, ...options });
}

export function renderWithRoute(ui: ReactElement, initialEntries: string[]) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <ProvidersWithRoute initialEntries={initialEntries}>{children}</ProvidersWithRoute>
    ),
  });
}

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

export { default as userEvent } from "@testing-library/user-event";
export { screen, waitFor, act } from "@testing-library/react";
