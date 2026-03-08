import IconButton from "@mui/material/IconButton";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useLibraryStore } from "../../stores/libraryStore";

interface Props {
  performanceId: string;
}

export default function FavoriteButton({ performanceId }: Props) {
  const isFavorite = useLibraryStore((s) => s.favoriteIds.includes(performanceId));
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  return (
    <IconButton
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(performanceId);
      }}
      color={isFavorite ? "secondary" : "default"}
      size="small"
    >
      {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
    </IconButton>
  );
}
