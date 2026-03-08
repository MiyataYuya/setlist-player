import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import FavoriteButton from "../common/FavoriteButton";
import { usePlayerStore } from "../../stores/playerStore";
import type { SongPerformance } from "../../data/types";

interface Props {
  song: SongPerformance;
  queue: SongPerformance[];
}

export default function SongCard({ song, queue }: Props) {
  const playSong = usePlayerStore((s) => s.playSong);

  const date = song.publishedAt
    ? new Date(song.publishedAt).toLocaleDateString("ja-JP")
    : "";

  const secondary = [song.artist, date].filter(Boolean).join(" ・ ");

  return (
    <ListItem
      disablePadding
      secondaryAction={<FavoriteButton performanceId={song.performanceId} />}
    >
      <ListItemButton onClick={() => playSong(song, queue)}>
        <ListItemAvatar>
          <Avatar
            variant="rounded"
            src={song.thumbnailUrl}
            sx={{ width: 48, height: 36 }}
          />
        </ListItemAvatar>
        <ListItemText
          primary={song.title}
          secondary={secondary || undefined}
          primaryTypographyProps={{ noWrap: true }}
          secondaryTypographyProps={{ noWrap: true }}
        />
      </ListItemButton>
    </ListItem>
  );
}
