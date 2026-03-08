import { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { useLibraryStore } from "../../stores/libraryStore";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

export default function SearchBar() {
  const setSearchQuery = useLibraryStore((s) => s.setSearchQuery);
  const [localQuery, setLocalQuery] = useState(
    useLibraryStore.getState().searchQuery
  );
  const debouncedQuery = useDebouncedValue(localQuery, 300);

  useEffect(() => {
    setSearchQuery(debouncedQuery);
  }, [debouncedQuery, setSearchQuery]);

  return (
    <TextField
      fullWidth
      size="small"
      placeholder="曲名・アーティストで検索"
      value={localQuery}
      onChange={(e) => setLocalQuery(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        },
      }}
      sx={{ mb: 1 }}
    />
  );
}
