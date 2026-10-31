import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MonthGrid from "../components/calendar/MonthGrid";
import StreamList from "../components/songs/StreamList";
import {
  calendarMonths,
  latestStreamDateInMonth,
  streamsByDate,
} from "../data/calendar";
import { formatDateKeyLabel, formatMonthKeyLabel } from "../data/jstDate";

export default function CalendarPage() {
  const [monthIndex, setMonthIndex] = useState(calendarMonths.length - 1);
  // 日を選ぶまでは「その月の最新配信日」が既定。月を移動したら既定に戻す。
  const [pickedDate, setPickedDate] = useState<string | null>(null);

  const hasMonths = calendarMonths.length > 0;
  const monthKey = calendarMonths[monthIndex] ?? "";
  const selectedDate = hasMonths
    ? pickedDate ?? latestStreamDateInMonth(monthKey)
    : null;

  const goToMonth = (nextIndex: number) => {
    setMonthIndex(nextIndex);
    setPickedDate(null);
  };

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ p: 2, maxWidth: 560, mx: "auto" }}>
        <Typography variant="h5" gutterBottom>
          カレンダー
        </Typography>

        {!hasMonths ? (
          <Typography variant="body2" color="text.secondary">
            配信がありません
          </Typography>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
              }}
            >
              <IconButton
                aria-label="前の月"
                disabled={monthIndex === 0}
                onClick={() => goToMonth(monthIndex - 1)}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {formatMonthKeyLabel(monthKey)}
              </Typography>
              <IconButton
                aria-label="次の月"
                disabled={monthIndex === calendarMonths.length - 1}
                onClick={() => goToMonth(monthIndex + 1)}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>

            <MonthGrid
              monthKey={monthKey}
              streamsByDate={streamsByDate}
              selectedDate={selectedDate}
              onSelectDate={setPickedDate}
            />
          </>
        )}
      </Box>

      {selectedDate && (
        <>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ px: 2, pt: 1 }}
          >
            {formatDateKeyLabel(selectedDate)}
          </Typography>
          <StreamList streams={streamsByDate.get(selectedDate) ?? []} />
        </>
      )}

      {hasMonths && !selectedDate && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
          この月の配信はありません
        </Typography>
      )}
    </Box>
  );
}
