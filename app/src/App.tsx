import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import BottomNav from "./components/layout/BottomNav";
import MiniPlayer from "./components/layout/MiniPlayer";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import LibraryPage from "./pages/LibraryPage";
import PlayerScreen from "./components/player/PlayerScreen";
import PlaylistPage from "./pages/PlaylistPage";
import YouTubeEmbed from "./components/player/YouTubeEmbed";
import { useCurrentSong } from "./stores/playerStore";

function AppContent() {
  const location = useLocation();
  const currentSong = useCurrentSong();
  const isPlayerPage = location.pathname === "/player";

  return (
    <>
      <Box
        sx={{
          pb: isPlayerPage ? 0 : "120px",
          minHeight: isPlayerPage ? undefined : "100vh",
        }}
      >
        {currentSong && (
          <Box sx={{ display: isPlayerPage ? "block" : "none" }}>
            <YouTubeEmbed />
          </Box>
        )}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/playlist/:id" element={<PlaylistPage />} />
          <Route path="/player" element={<PlayerScreen />} />
        </Routes>
      </Box>
      <MiniPlayer />
      <BottomNav />
    </>
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
