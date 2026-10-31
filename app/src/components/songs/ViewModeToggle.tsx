import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import GridViewIcon from "@mui/icons-material/GridView";
import { useLayoutStore } from "../../stores/layoutStore";
import { useSongViewMode } from "../../hooks/useSongViewMode";
import type { SongViewMode } from "../../stores/layoutStore";
import type { ReactElement } from "react";

const MODES: { value: SongViewMode; label: string; icon: ReactElement }[] = [
  { value: "list", label: "リスト", icon: <ViewListIcon fontSize="small" /> },
  { value: "tile", label: "タイル", icon: <ViewAgendaIcon fontSize="small" /> },
  { value: "grid", label: "グリッド", icon: <GridViewIcon fontSize="small" /> },
];

export default function ViewModeToggle() {
  const mode = useSongViewMode();
  const setSongViewMode = useLayoutStore((s) => s.setSongViewMode);

  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={mode}
      // 選択中をもう一度押すと null が来る。モードは常にどれか1つなので無視する
      onChange={(_, next: SongViewMode | null) => next && setSongViewMode(next)}
      aria-label="表示方法"
    >
      {MODES.map(({ value, label, icon }) => (
        <Tooltip key={value} title={label}>
          <ToggleButton value={value} aria-label={label}>
            {icon}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
}
