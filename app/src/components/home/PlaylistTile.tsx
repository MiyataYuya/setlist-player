import Box from "@mui/material/Box";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import { useNavigate } from "react-router-dom";
import { songPerformanceById } from "../../data/songs";
import { CARD_THUMBNAIL_WIDTH } from "../songs/cardGrid";
import type { CardVariant } from "../songs/cardGrid";
import type { Playlist } from "../../stores/playlistStore";

interface Props {
  playlist: Playlist;
  /** vertical = 大サムネ上・下に名前、horizontal = サムネ左・名前右（1列表示用） */
  variant?: CardVariant;
}

export default function PlaylistTile({ playlist, variant = "vertical" }: Props) {
  const navigate = useNavigate();
  const firstSong = songPerformanceById.get(playlist.performanceIds[0]);
  const isVertical = variant === "vertical";

  const thumbnail = (
    <Box
      sx={{
        width: isVertical ? "100%" : CARD_THUMBNAIL_WIDTH,
        flexShrink: 0,
        aspectRatio: "16 / 9",
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "action.hover",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {firstSong ? (
        <Box
          component="img"
          src={firstSong.thumbnailUrl}
          alt=""
          loading="lazy"
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <QueueMusicIcon fontSize={isVertical ? "medium" : "small"} sx={{ color: "text.secondary" }} />
      )}
    </Box>
  );

  const text = (
    <>
      <Typography variant="body2" fontWeight="bold" noWrap>
        {playlist.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap display="block">
        {playlist.performanceIds.length}曲
      </Typography>
    </>
  );

  return (
    <CardActionArea
      onClick={() => navigate(`/playlist/${playlist.id}`)}
      sx={{
        p: 0.5,
        borderRadius: 1,
        ...(!isVertical && {
          display: "flex",
          alignItems: "center",
          gap: 1,
          minWidth: 0,
        }),
      }}
    >
      {thumbnail}
      {/* minWidth:0 がないと flex 子要素が縮まず noWrap の省略が効かない */}
      <Box sx={isVertical ? { mt: 0.5 } : { minWidth: 0, flex: 1 }}>{text}</Box>
    </CardActionArea>
  );
}
