import { useState } from "react";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import { usePlayerStore } from "../../stores/playerStore";
import { useLibraryStore } from "../../stores/libraryStore";
import AddToPlaylistDialog from "../playlist/AddToPlaylistDialog";
import type { SongPerformance } from "../../data/types";

interface Props {
  song: SongPerformance;
  queue: SongPerformance[];
}

export default function SongCard({ song, queue }: Props) {
  const playSong = usePlayerStore((s) => s.playSong);
  const isFavorite = useLibraryStore((s) => s.favoriteIds.includes(song.performanceId));
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);

  const date = song.publishedAt
    ? new Date(song.publishedAt).toLocaleDateString("ja-JP")
    : "";

  const secondary = [song.artist, date].filter(Boolean).join(" ・ ");

  function handleMenuOpen(e: React.MouseEvent<HTMLElement>): void {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  }

  function handleMenuClose(): void {
    setMenuAnchor(null);
  }

  function handleToggleFavorite(): void {
    toggleFavorite(song.performanceId);
    handleMenuClose();
  }

  function handleAddToPlaylist(): void {
    handleMenuClose();
    setPlaylistDialogOpen(true);
  }

  return (
    <>
      <ListItem
        disablePadding
        secondaryAction={
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        }
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

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={handleToggleFavorite}>
          <ListItemIcon>
            {isFavorite ? <FavoriteIcon color="secondary" /> : <FavoriteBorderIcon />}
          </ListItemIcon>
          <ListItemText>お気に入り</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleAddToPlaylist}>
          <ListItemIcon>
            <PlaylistAddIcon />
          </ListItemIcon>
          <ListItemText>プレイリストに追加</ListItemText>
        </MenuItem>
      </Menu>

      <AddToPlaylistDialog
        open={playlistDialogOpen}
        onClose={() => setPlaylistDialogOpen(false)}
        performanceId={song.performanceId}
      />
    </>
  );
}
