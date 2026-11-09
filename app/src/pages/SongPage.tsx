import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { PILL_BUTTON_SX } from "../components/common/pillButtonSx";
import SongList from "../components/songs/SongList";
import StyleFilter from "../components/songs/StyleFilter";
import ViewModeToggle from "../components/songs/ViewModeToggle";
import { PERFORMANCE_STYLES } from "../data/types";
import { STYLE_LABEL } from "../data/performanceStyle";
import { useCatalog } from "../stores/catalogStore";
import { usePlayerStore } from "../stores/playerStore";
import type { PerformanceStyle, SongPerformance } from "../data/types";

/** 「2回 ・ 弾き語り 1・歌枠 1」。0回のスタイルは書かない */
function summarise(performances: SongPerformance[]): string {
  const byStyle = PERFORMANCE_STYLES.map((style) => ({
    style,
    count: performances.filter((p) => p.style === style).length,
  }))
    .filter(({ count }) => count > 0)
    .map(({ style, count }) => `${STYLE_LABEL[style]} ${count}`)
    .join("・");
  return [`${performances.length}回`, byStyle].filter(Boolean).join(" ・ ");
}

/** 1曲の歌唱をすべて並べるページ（弾き語り版・歌枠版の聴き比べ用） */
export default function SongPage() {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const { songPerformancesBySongId } = useCatalog();
  const playSong = usePlayerStore((s) => s.playSong);
  const [style, setStyle] = useState<PerformanceStyle | null>(null);

  const performances = useMemo(
    () => (songId ? songPerformancesBySongId.get(songId) : undefined) ?? [],
    [songPerformancesBySongId, songId]
  );
  const listed = useMemo(
    () =>
      style === null ? performances : performances.filter((p) => p.style === style),
    [performances, style]
  );

  if (performances.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">曲が見つかりません</Typography>
      </Box>
    );
  }

  const { title, artist } = performances[0];

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <IconButton edge="start" aria-label="戻る" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }} />
          <ViewModeToggle />
        </Box>
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        {artist && (
          <Typography variant="body1" color="text.secondary">
            {artist}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
          {summarise(performances)}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <StyleFilter value={style} onChange={setStyle} />
          <Button
            variant="contained"
            size="small"
            startIcon={<PlayArrowIcon />}
            onClick={() => listed.length > 0 && playSong(listed[0], listed)}
            sx={PILL_BUTTON_SX}
          >
            すべて再生
          </Button>
        </Box>
      </Box>
      <SongList songs={listed} />
    </Box>
  );
}
