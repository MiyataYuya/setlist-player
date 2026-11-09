import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { PERFORMANCE_STYLES } from "../../data/types";
import { STYLE_LABEL, STYLE_MARK } from "../../data/performanceStyle";
import type { PerformanceStyle } from "../../data/types";

interface Props {
  /** null は絞り込みなし */
  value: PerformanceStyle | null;
  onChange: (style: PerformanceStyle | null) => void;
}

/** 演奏スタイル（すべて / 弾き語り / 歌枠）の単一選択 */
export default function StyleFilter({ value, onChange }: Props) {
  return (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
      <Chip
        label="すべて"
        size="small"
        variant={value === null ? "filled" : "outlined"}
        onClick={() => onChange(null)}
      />
      {PERFORMANCE_STYLES.map((style) => (
        <Chip
          key={style}
          // 記号は飾り。ボタン名は「弾き語り」「歌枠」にする
          icon={<span aria-hidden="true">{STYLE_MARK[style]}</span>}
          label={STYLE_LABEL[style]}
          size="small"
          variant={value === style ? "filled" : "outlined"}
          onClick={() => onChange(style)}
        />
      ))}
    </Box>
  );
}
