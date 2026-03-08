import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { useTagStore } from "../../stores/tagStore";

interface Props {
  selectedTags: string[];
  onToggle: (tag: string) => void;
}

export default function TagFilter({ selectedTags, onToggle }: Props) {
  const tags = useTagStore((s) => s.tags);

  if (tags.length === 0) return null;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        overflowX: "auto",
        flexWrap: "nowrap",
        mt: 1,
      }}
    >
      {tags.map((tag) => (
        <Chip
          key={tag}
          label={tag}
          size="small"
          variant={selectedTags.includes(tag) ? "filled" : "outlined"}
          onClick={() => onToggle(tag)}
        />
      ))}
    </Box>
  );
}
