import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlayerStore } from "../../stores/playerStore";
import { NAV_ITEMS } from "./navItems";

export default function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (path: string) => {
    const store = usePlayerStore.getState();
    if (store.isPlayerOpen) store.closePlayer();
    navigate(path);
  };

  return (
    <Box
      component="nav"
      sx={{
        width: 220,
        flexShrink: 0,
        height: "100vh",
        overflowY: "auto",
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        position: "sticky",
        top: 0,
        py: 2,
      }}
    >
      <Typography variant="h6" sx={{ px: 3, pb: 2, fontWeight: 700 }}>
        セトリプレイヤー
      </Typography>
      <List>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => handleClick(item.path)}
            sx={{ borderRadius: 2, mx: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
