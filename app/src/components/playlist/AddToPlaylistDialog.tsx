import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { usePlaylistStore } from "../../stores/playlistStore";

interface Props {
  open: boolean;
  onClose: () => void;
  performanceId: string;
}

export default function AddToPlaylistDialog({ open, onClose, performanceId }: Props) {
  const playlists = usePlaylistStore((s) => s.playlists);
  const addToPlaylist = usePlaylistStore((s) => s.addToPlaylist);
  const createPlaylist = usePlaylistStore((s) => s.createPlaylist);
  const [newName, setNewName] = useState("");

  function handleSelectPlaylist(playlistId: string): void {
    addToPlaylist(playlistId, performanceId);
    onClose();
  }

  function handleCreate(): void {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = createPlaylist(trimmed);
    addToPlaylist(id, performanceId);
    setNewName("");
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>プレイリストに追加</DialogTitle>
      {playlists.length > 0 ? (
        <List disablePadding>
          {playlists.map((pl) => (
            <ListItemButton key={pl.id} onClick={() => handleSelectPlaylist(pl.id)}>
              <ListItemText
                primary={pl.name}
                secondary={`${pl.performanceIds.length}曲`}
              />
            </ListItemButton>
          ))}
        </List>
      ) : (
        <Box sx={{ px: 3, pb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            プレイリストがありません
          </Typography>
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 1, p: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="新しいプレイリスト名"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
        />
        <Button variant="contained" onClick={handleCreate} disabled={!newName.trim()}>
          作成
        </Button>
      </Box>
    </Dialog>
  );
}
