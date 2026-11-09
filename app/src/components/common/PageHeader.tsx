import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

interface Props {
  title: string;
  /** タイトル行の右端に置く操作（表示方法の切替など） */
  action?: ReactNode;
}

/** ページ見出し。一覧系の画面で操作の置き場所を揃えるために共通化する */
export default function PageHeader({ title, action }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        mb: 1,
      }}
    >
      <Typography variant="h5">{title}</Typography>
      {action}
    </Box>
  );
}
