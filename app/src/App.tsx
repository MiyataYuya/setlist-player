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
