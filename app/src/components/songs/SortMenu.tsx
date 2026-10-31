import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import SwapVertIcon from "@mui/icons-material/SwapVert";

export type SortOption =
  | "date-desc"
  | "date-asc"
  | "title-asc"
  | "title-desc"
  | "artist-asc"
  | "artist-desc";

interface Props {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const sortLabels: Record<SortOption, string> = {
  "date-desc": "新しい順",
  "date-asc": "古い順",
  "title-asc": "曲名 A→Z",
  "title-desc": "曲名 Z→A",
  "artist-asc": "アーティスト A→Z",
  "artist-desc": "アーティスト Z→A",
};

export default function SortMenu({ value, onChange }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  // アイコンだけだと現在の並び順が分からないので、ラベルに含める
  const label = `並び替え: ${sortLabels[value]}`;

  function handleSelect(option: SortOption): void {
    onChange(option);
    setAnchor(null);
  }

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          size="small"
          aria-label={label}
          onClick={(e) => setAnchor(e.currentTarget)}
        >
          <SwapVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        {Object.entries(sortLabels).map(([key, optionLabel]) => (
          <MenuItem
            key={key}
            // 単一選択のメニューなので menuitem ではなく menuitemradio が正しい
            role="menuitemradio"
            aria-checked={key === value}
            selected={key === value}
            onClick={() => handleSelect(key as SortOption)}
          >
            {optionLabel}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
