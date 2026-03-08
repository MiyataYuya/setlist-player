import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import BottomNav from "./components/layout/BottomNav";
import MiniPlayer from "./components/layout/MiniPlayer";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import LibraryPage from "./pages/LibraryPage";
import PlayerScreen from "./components/player/PlayerScreen";
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
          pb: "120px", // BottomNav + MiniPlayer 分の余白
          minHeight: "100vh",
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
