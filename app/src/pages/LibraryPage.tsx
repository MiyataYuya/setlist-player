import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SongList from "../components/songs/SongList";
import { useLibraryStore } from "../stores/libraryStore";
import { useHistoryStore } from "../stores/historyStore";
import { usePlaylistStore } from "../stores/playlistStore";
import { songPerformances } from "../data/songs";

const spMap = new Map(songPerformances.map((s) => [s.performanceId, s]));

export default function LibraryPage() {
  const navigate = useNavigate();
  const favoriteIds = useLibraryStore((s) => s.favoriteIds);
  const history = useHistoryStore((s) => s.history);
  const clearHistory = useHistoryStore((s) => s.clearHistory);
  const playlists = usePlaylistStore((s) => s.playlists);
  const createPlaylist = usePlaylistStore((s) => s.createPlaylist);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const favorites = useMemo(
    () => songPerformances.filter((s) => favoriteIds.includes(s.performanceId)),
    [favoriteIds]
  );

  function handleCreatePlaylist(): void {
    const trimmed = newPlaylistName.trim();
    if (!trimmed) return;
    const id = createPlaylist(trimmed);
    setNewPlaylistName("");
    setCreateDialogOpen(false);
    navigate(`/playlist/${id}`);
  }

  const historySongs = useMemo(
    () =>
      history
        .slice(0, 50)
        .map((h) => spMap.get(h.performanceId))
        .filter(Boolean) as typeof songPerformances,
    [history]
  );

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          ライブラリ
        </Typography>
      </Box>

      {/* プレイリスト */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            プレイリスト ({playlists.length})
          </Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
            新しいプレイリスト
          </Button>
        </Box>
        {playlists.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            プレイリストがありません
          </Typography>
        ) : (
          <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1 }}>
            {playlists.map((pl) => {
              const firstSong = pl.performanceIds.length > 0
                ? spMap.get(pl.performanceIds[0])
                : undefined;
              return (
                <Card key={pl.id} sx={{ minWidth: 140, flexShrink: 0 }}>
                  <CardActionArea
                    onClick={() => navigate(`/playlist/${pl.id}`)}
                    sx={{ p: 1.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}
                  >
                    <Avatar
                      variant="rounded"
                      src={firstSong?.thumbnailUrl}
                      sx={{ width: 56, height: 42 }}
                    />
                    <Typography variant="body2" fontWeight="bold" noWrap sx={{ maxWidth: 120 }}>
                      {pl.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pl.performanceIds.length}曲
                    </Typography>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      {/* プレイリスト作成ダイアログ */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>新しいプレイリスト</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="プレイリスト名"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreatePlaylist();
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()}>
            作成
          </Button>
        </DialogActions>
      </Dialog>

      {/* 再生履歴 */}
      <Box sx={{ px: 2, mb: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              再生履歴
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({historySongs.length})
            </Typography>
            <IconButton
              size="small"
              onClick={() => setHistoryOpen((v) => !v)}
            >
              {historyOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          {history.length > 0 && (
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={clearHistory}
            >
              クリア
            </Button>
          )}
        </Box>
      </Box>
      <Collapse in={historyOpen}>
        {historySongs.length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              再生履歴はありません
            </Typography>
          </Box>
        ) : (
          <SongList songs={historySongs} />
        )}
      </Collapse>

      {/* お気に入り */}
      <Box sx={{ px: 2, mt: 2, mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          お気に入り ({favorites.length})
        </Typography>
      </Box>
      {favorites.length === 0 ? (
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            お気に入りに追加された曲がありません
          </Typography>
        </Box>
      ) : (
        <SongList songs={favorites} />
      )}
    </Box>
  );
}
