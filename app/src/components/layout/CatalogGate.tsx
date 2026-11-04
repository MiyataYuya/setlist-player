import { useEffect } from "react";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useCatalogStore } from "../../stores/catalogStore";

const centerSx = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  px: 2,
} as const;

/** 曲データの読み込みが終わるまで画面を出さず、失敗時は再試行を促す */
export default function CatalogGate({ children }: { children: ReactNode }) {
  const status = useCatalogStore((s) => s.status);
  const load = useCatalogStore((s) => s.load);

  useEffect(() => {
    // StrictMode の二重実行でも、2回目は loading になっているので取得は1回だけ
    if (useCatalogStore.getState().status === "idle") {
      void load();
    }
  }, [load]);

  if (status === "ready") return <>{children}</>;

  if (status === "error") {
    return (
      <Box sx={centerSx}>
        <Typography>曲データを読み込めませんでした</Typography>
        <Button variant="outlined" onClick={() => void load()}>
          再試行
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={centerSx}>
      <CircularProgress aria-label="曲データを読み込み中" />
    </Box>
  );
}
