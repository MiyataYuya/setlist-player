import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import SongCard from "./SongCard";
import type { SongPerformance } from "../../data/types";

interface Props {
  songs: SongPerformance[];
}

export default function SongList({ songs }: Props) {
  if (songs.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">曲が見つかりません</Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {songs.map((song) => (
        <SongCard key={song.performanceId} song={song} queue={songs} />
      ))}
    </List>
  );
}
