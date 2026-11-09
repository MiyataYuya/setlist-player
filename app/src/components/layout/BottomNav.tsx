import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlayerStore } from "../../stores/playerStore";
import { NAV_ITEMS } from "./navItems";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // ナビに無いページ（曲ページ・プレイリスト）では null にしてどのタブも選択しない
  const currentPath =
    NAV_ITEMS.find((item) => item.path === location.pathname)?.path ?? null;

  return (
    <Paper
      sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1200 }}
      elevation={8}
    >
      <BottomNavigation
        value={currentPath}
        onChange={(_, newPath: string) => {
          if (usePlayerStore.getState().isPlayerOpen) {
            usePlayerStore.getState().closePlayer();
          }
          navigate(newPath);
        }}
        showLabels
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.path}
            value={item.path}
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
