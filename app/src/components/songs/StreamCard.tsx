import { useState } from "react";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import type { Stream } from "../../data/types";
import { usePlayerStore } from "../../stores/playerStore";
import SongList from "./SongList";

interface Props {
  stream: Stream;
}

export default function StreamCard({ stream }: Props) {
  const [open, setOpen] = useState(false);
  const playSong = usePlayerStore((s) => s.playSong);

  const date = stream.publishedAt
    ? new Date(stream.publishedAt).toLocaleDateString("ja-JP")
    : "";

  // タイトルから定型句を除去して短くする
  const displayTitle = stream.title
    .replace(/【[^】]*】/g, "")         // 【...】全体を除去
    .replace(/\s*-\s*ミナミイズミ.*$/, "")  // " - ミナミイズミ ..." 除去
    .replace(/\s*singing stream.*$/i, "")   // "singing stream ..." 除去
    .replace(/\s*#\S+/g, "")           // ハッシュタグ除去
    .trim() || date;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSong(stream.songs[0], stream.songs);
  };

  return (
    <>
      <ListItem
        disablePadding
        secondaryAction={
          <IconButton size="small" onClick={handlePlay}>
            <PlayArrowIcon />
          </IconButton>
        }
      >
        <ListItemButton onClick={() => setOpen(!open)}>
          <ListItemAvatar>
            <Avatar
              variant="rounded"
              src={stream.thumbnailUrl}
              sx={{ width: 48, height: 36 }}
            />
          </ListItemAvatar>
          <ListItemText
            primary={displayTitle}
            secondary={`${date} ・ ${stream.songCount} 曲`}
            primaryTypographyProps={{ noWrap: true }}
            secondaryTypographyProps={{ noWrap: true }}
          />
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemButton>
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <SongList songs={stream.songs} nested />
      </Collapse>
    </>
  );
}
