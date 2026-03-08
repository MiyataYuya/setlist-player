import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";

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
  function handleChange(event: SelectChangeEvent) {
    onChange(event.target.value as SortOption);
  }

  return (
    <Select size="small" value={value} onChange={handleChange} fullWidth>
      {Object.entries(sortLabels).map(([key, label]) => (
        <MenuItem key={key} value={key}>
          {label}
        </MenuItem>
      ))}
    </Select>
  );
}
