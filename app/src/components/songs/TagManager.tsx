import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useTagStore } from "../../stores/tagStore";

interface Props {
  open: boolean;
  onClose: () => void;
  performanceId: string;
}

export default function TagManager({ open, onClose, performanceId }: Props) {
  const tags = useTagStore((s) => s.tags);
  const songTags = useTagStore((s) => s.songTags[performanceId]) ?? [];
  const addTag = useTagStore((s) => s.addTag);
  const assignTag = useTagStore((s) => s.assignTag);
  const unassignTag = useTagStore((s) => s.unassignTag);
  const [newTag, setNewTag] = useState("");

  function handleToggle(tag: string): void {
    if (songTags.includes(tag)) {
      unassignTag(performanceId, tag);
    } else {
      assignTag(performanceId, tag);
    }
  }

  function handleAdd(): void {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    addTag(trimmed);
    assignTag(performanceId, trimmed);
    setNewTag("");
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>タグ管理</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              variant={songTags.includes(tag) ? "filled" : "outlined"}
              onClick={() => handleToggle(tag)}
            />
          ))}
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            size="small"
            label="新しいタグ"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            sx={{ flex: 1 }}
          />
          <Button variant="contained" onClick={handleAdd}>
            追加
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
