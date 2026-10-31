import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { buildMonthWeeks } from "../../data/calendar";
import { WEEKDAY_LABELS, splitDateKey } from "../../data/jstDate";
import type { Stream } from "../../data/types";

// 「N配信」の日だけ高くなって行が不揃いにならないよう、高さを固定する
const CELL_SX: SxProps<Theme> = {
  width: "100%",
  height: 48,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 1,
};

interface Props {
  /** 表示する月 (`YYYY-MM`) */
  monthKey: string;
  streamsByDate: Map<string, Stream[]>;
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
}

export default function MonthGrid({
  monthKey,
  streamsByDate,
  selectedDate,
  onSelectDate,
}: Props) {
  return (
    <Box
      component="table"
      sx={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}
    >
      <Box component="thead">
        <Box component="tr">
          {WEEKDAY_LABELS.map((weekday, index) => (
            <Box
              component="th"
              scope="col"
              key={weekday}
              sx={{ py: 0.5, fontWeight: 500 }}
            >
              <Typography variant="caption" sx={{ color: weekdayColor(index) }}>
                {weekday}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Box component="tbody">
        {buildMonthWeeks(monthKey).map((week, weekIndex) => (
          <Box component="tr" key={weekIndex}>
            {week.map((dateKey, dayIndex) => (
              <Box
                component="td"
                key={dateKey ?? `empty-${dayIndex}`}
                sx={{ p: 0.25, verticalAlign: "top" }}
              >
                {dateKey &&
                  (streamsByDate.has(dateKey) ? (
                    <StreamDay
                      dateKey={dateKey}
                      count={streamsByDate.get(dateKey)!.length}
                      isSelected={dateKey === selectedDate}
                      onSelect={onSelectDate}
                    />
                  ) : (
                    <InertDay dateKey={dateKey} weekdayIndex={dayIndex} />
                  ))}
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/** 配信がある日。タップでその日を選択する */
function StreamDay({
  dateKey,
  count,
  isSelected,
  onSelect,
}: {
  dateKey: string;
  count: number;
  isSelected: boolean;
  onSelect: (dateKey: string) => void;
}) {
  const [, month, day] = splitDateKey(dateKey);

  return (
    <ButtonBase
      onClick={() => onSelect(dateKey)}
      aria-label={`${month}月${day}日・${count}配信`}
      aria-current={isSelected ? "date" : undefined}
      sx={{
        ...CELL_SX,
        bgcolor: isSelected ? "primary.dark" : "action.hover",
        outline: isSelected ? "2px solid" : "none",
        outlineColor: "primary.main",
      }}
    >
      <Typography variant="body2" component="span">
        {day}
      </Typography>
      {count === 1 ? (
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: "primary.main",
            mt: 0.25,
          }}
        />
      ) : (
        <Typography
          variant="caption"
          sx={{ color: "primary.main", lineHeight: 1.2 }}
        >
          {count}配信
        </Typography>
      )}
    </ButtonBase>
  );
}

/** 配信がない日。タップしても見るものがないためボタンにしない */
function InertDay({
  dateKey,
  weekdayIndex,
}: {
  dateKey: string;
  weekdayIndex: number;
}) {
  const [, , day] = splitDateKey(dateKey);

  return (
    <Box sx={{ ...CELL_SX, opacity: 0.5 }}>
      <Typography
        variant="body2"
        component="span"
        sx={{ color: weekdayColor(weekdayIndex) }}
      >
        {day}
      </Typography>
    </Box>
  );
}

/** 日曜=赤、土曜=青の日本式配色 */
function weekdayColor(weekdayIndex: number): string {
  if (weekdayIndex === 0) return "error.light";
  if (weekdayIndex === 6) return "info.light";
  return "text.secondary";
}
