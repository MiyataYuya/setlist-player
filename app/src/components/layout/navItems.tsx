import HomeIcon from "@mui/icons-material/Home";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SearchIcon from "@mui/icons-material/Search";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "ホーム", icon: <HomeIcon />, path: "/" },
  { label: "カレンダー", icon: <CalendarMonthIcon />, path: "/calendar" },
  { label: "検索", icon: <SearchIcon />, path: "/search" },
  { label: "ライブラリ", icon: <LibraryMusicIcon />, path: "/library" },
];
