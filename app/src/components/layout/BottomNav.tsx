import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
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

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentIndex = NAV_ITEMS.findIndex(
    (item) => item.path === location.pathname
  );

  return (
    <Paper
      sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1200 }}
      elevation={8}
    >
      <BottomNavigation
        value={currentIndex >= 0 ? currentIndex : 0}
        onChange={(_, newValue) => {
          if (usePlayerStore.getState().isPlayerOpen) {
            usePlayerStore.getState().closePlayer();
          }
          navigate(NAV_ITEMS[newValue].path);
        }}
        showLabels
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
      <div
        style={{
          height: "env(safe-area-inset-bottom, 0px)",
          backgroundColor: "inherit",
        }}
      />
    </Paper>
  );
}
