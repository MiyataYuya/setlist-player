import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import { usePlaylistStore } from "../stores/playlistStore";
import { usePlayerStore } from "../stores/playerStore";
import { songPerformances } from "../data/songs";
import type { SongPerformance } from "../data/types";

const spMap = new Map(songPerformances.map((s) => [s.performanceId, s]));

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playlist = usePlaylistStore((s) => s.playlists.find((p) => p.id === id));
  const renamePlaylist = usePlaylistStore((s) => s.renamePlaylist);
  const deletePlaylist = usePlaylistStore((s) => s.deletePlaylist);
  const removeFromPlaylist = usePlaylistStore((s) => s.removeFromPlaylist);
  const reorderPlaylist = usePlaylistStore((s) => s.reorderPlaylist);
  const playSong = usePlayerStore((s) => s.playSong);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

  const songs = useMemo(() => {
    if (!playlist) return [];
    return playlist.performanceIds
      .map((pid) => spMap.get(pid))
      .filter((s): s is SongPerformance => s !== undefined);
  }, [playlist]);

  if (!playlist) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">プレイリストが見つかりません</Typography>
      </Box>
    );
  }

  function handleStartEdit(): void {
    setEditName(playlist!.name);
    setIsEditing(true);
  }

  function handleFinishEdit(): void {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== playlist!.name) {
      renamePlaylist(playlist!.id, trimmed);
    }
    setIsEditing(false);
  }

  function handlePlay(): void {
    if (songs.length === 0) return;
    playSong(songs[0], songs);
  }

  function handleShuffle(): void {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    playSong(shuffled[0], shuffled);
  }

  function handleDelete(): void {
    deletePlaylist(playlist!.id);
    navigate("/library");
  }

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ p: 2 }}>
        {isEditing ? (
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleFinishEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleFinishEdit();
            }}
          />
        ) : (
          <Typography
            variant="h5"
            onClick={handleStartEdit}
            sx={{ cursor: "pointer", "&:hover": { opacity: 0.7 } }}
          >
            {playlist.name}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {songs.length}曲
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1, px: 2, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={handlePlay}
          disabled={songs.length === 0}
        >
          再生
        </Button>
        <Button
          variant="outlined"
          startIcon={<ShuffleIcon />}
          onClick={handleShuffle}
          disabled={songs.length === 0}
        >
          シャッフル再生
        </Button>
      </Box>

      <List disablePadding>
        {songs.map((song, index) => (
          <ListItem
            key={song.performanceId}
            secondaryAction={
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <IconButton
                  size="small"
                  disabled={index === 0}
                  onClick={() => reorderPlaylist(playlist.id, index, index - 1)}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={index === songs.length - 1}
                  onClick={() => reorderPlaylist(playlist.id, index, index + 1)}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => removeFromPlaylist(playlist.id, song.performanceId)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            <ListItemAvatar>
              <Avatar
                variant="rounded"
                src={song.thumbnailUrl}
                sx={{ width: 48, height: 36 }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={song.title}
              secondary={song.artist}
              primaryTypographyProps={{ noWrap: true }}
              secondaryTypographyProps={{ noWrap: true }}
              sx={{ mr: 12 }}
            />
          </ListItem>
        ))}
      </List>

      {songs.length === 0 && (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            プレイリストに曲がありません
          </Typography>
        </Box>
      )}

      <Box sx={{ p: 2, mt: 2 }}>
        <Button
          fullWidth
          color="error"
          variant="outlined"
          startIcon={<DeleteIcon />}
          onClick={handleDelete}
        >
          プレイリストを削除
        </Button>
      </Box>
    </Box>
  );
}
