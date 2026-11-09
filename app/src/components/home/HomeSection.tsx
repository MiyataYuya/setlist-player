import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Link as RouterLink } from "react-router-dom";
import type { ReactNode } from "react";
import { songGridSx } from "../songs/cardGrid";

/**
 * ホームのセクションは表示方法の設定に従わず、常にタイル幅の多列で並べる。
 * 狭い画面では1列に畳まれるのでモバイルではリストと同じ見た目になる。
 */
const SECTION_GRID_SX = songGridSx("tile");

interface Props {
  title: string;
  /** 見出しの下に小さく添える補足（最新配信のタイトル・日付など） */
  subtitle?: string;
  /** 元データの総数。0 ならセクションごと描画しない */
  itemCount: number;
  /** 実際にグリッドへ出している数。総数を下回るとき「すべて表示」を出す */
  shownCount?: number;
  seeAllPath?: string;
  children: ReactNode;
}

export default function HomeSection({
  title,
  subtitle,
  itemCount,
  shownCount,
  seeAllPath,
  children,
}: Props) {
  if (itemCount === 0) return null;

  const hasMore = shownCount != null && itemCount > shownCount;

  return (
    <Box component="section" aria-label={title} sx={{ px: 2, mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 1,
          mb: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight="bold" noWrap>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {subtitle}
            </Typography>
          )}
        </Box>
        {hasMore && seeAllPath && (
          <Link
            component={RouterLink}
            to={seeAllPath}
            variant="body2"
            underline="hover"
            sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}
          >
            すべて表示
            <ChevronRightIcon fontSize="small" />
          </Link>
        )}
      </Box>
      <Box sx={SECTION_GRID_SX}>
        {children}
      </Box>
    </Box>
  );
}
