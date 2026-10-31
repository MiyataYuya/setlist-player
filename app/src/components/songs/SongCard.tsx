import { memo, useState } from "react";
import Box from "@mui/material/Box";
import CardActionArea from "@mui/material/CardActionArea";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import { usePlayerStore } from "../../stores/playerStore";
import { useLibraryStore } from "../../stores/libraryStore";
import AddToPlaylistDialog from "../playlist/AddToPlaylistDialog";
import { formatJstDate } from "../../data/jstDate";
import { CARD_THUMBNAIL_WIDTH } from "./cardGrid";
import type { CardVariant } from "./cardGrid";
import type { SongPerformance } from "../../data/types";

interface Props {
  song: SongPerformance;
  queue: SongPerformance[];
  /** horizontal = サムネ左・テキスト右（リスト/タイル）、vertical = 大サムネ上・下に文字（グリッド） */
  variant?: CardVariant;
}

function SongCard({ song, queue, variant = "horizontal" }: Props) {
  const playSong = usePlayerStore((s) => s.playSong);
  const isFavorite = useLibraryStore((s) => s.favoriteIds.includes(song.performanceId));
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);

  const isVertical = variant === "vertical";
  const date = formatJstDate(song.publishedAt);
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
    <Box
      role="listitem"
      sx={isVertical ? { position: "relative" } : { display: "flex", alignItems: "center", minWidth: 0 }}
    >
      <CardActionArea
        onClick={() => playSong(song, queue)}
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
        <Box
          component="img"
          src={song.thumbnailUrl}
          alt=""
          loading="lazy"
          sx={{
            width: isVertical ? "100%" : CARD_THUMBNAIL_WIDTH,
            flexShrink: 0,
            aspectRatio: "16 / 9",
            objectFit: "cover",
            borderRadius: 1,
            display: "block",
            bgcolor: "action.hover",
          }}
        />
        {/* minWidth:0 がないと flex 子要素が縮まず noWrap の省略が効かない */}
        <Box sx={isVertical ? { mt: 0.5, minWidth: 0 } : { minWidth: 0, flex: 1 }}>
          <Typography variant="body2" noWrap>
            {song.title}
          </Typography>
          {secondary && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {secondary}
            </Typography>
          )}
        </Box>
      </CardActionArea>

      {/* ⋮ は再生用のアクション領域の外に置く（ボタンの入れ子を避けるため）。
          縦型ではサムネに重ねて、テキストが幅いっぱい使えるようにする。 */}
      <IconButton
        size="small"
        onClick={handleMenuOpen}
        sx={
          isVertical
            ? {
                position: "absolute",
                top: 8,
                right: 8,
                bgcolor: "rgba(0, 0, 0, 0.55)",
                "&:hover": { bgcolor: "rgba(0, 0, 0, 0.75)" },
              }
            : { flexShrink: 0 }
        }
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      {/* 閉じている間も要素ツリーは組まれるため、開くまでマウントしない。
          一覧には数千枚のカードが並ぶので、ダイアログ内の playlistStore 購読が効いてくる。 */}
      {menuAnchor && (
        <Menu anchorEl={menuAnchor} open onClose={handleMenuClose}>
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
      )}

      {playlistDialogOpen && (
        <AddToPlaylistDialog
          open
          onClose={() => setPlaylistDialogOpen(false)}
          performanceId={song.performanceId}
        />
      )}
    </Box>
  );
}

// 無限スクロールの1ページ追加ごとに、すでに並んでいるカードが全部再描画されるのを防ぐ。
// song/queue は共にモジュールデータか useMemo 済みで参照が安定している。
export default memo(SongCard);
