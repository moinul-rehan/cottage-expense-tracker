"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function toIso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function expandRangeDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/** A month-grid calendar for picking a start/end date range where specific
 * dates can be fully disabled (greyed out, unclickable) - used to block
 * assigning bazaar duty over dates another member already has. Native
 * `<input type="date">` has no way to disable individual dates, so this
 * replaces it for that one flow. */
export function RangeCalendar({
  start,
  end,
  onChange,
  disabledRanges,
  minDate,
}: {
  start: string | null;
  end: string | null;
  onChange: (start: string | null, end: string | null) => void;
  /** Date ranges (inclusive) that cannot be selected at all. */
  disabledRanges: { start_date: string; end_date: string }[];
  /** ISO date string; nothing before this is selectable. */
  minDate: string;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const disabledSet = new Set(disabledRanges.flatMap((r) => expandRangeDates(r.start_date, r.end_date)));

  function isDisabled(iso: string) {
    return iso < minDate || disabledSet.has(iso);
  }

  function rangeCrossesDisabled(a: string, b: string) {
    const [lo, hi] = a <= b ? [a, b] : [b, a];
    for (const iso of expandRangeDates(lo, hi)) {
      if (disabledSet.has(iso)) return true;
    }
    return false;
  }

  function handlePick(iso: string) {
    if (isDisabled(iso)) return;
    if (!start || end) {
      onChange(iso, null);
      return;
    }
    if (iso < start) {
      onChange(iso, null);
      return;
    }
    if (rangeCrossesDisabled(start, iso)) {
      onChange(iso, null);
      return;
    }
    onChange(start, iso);
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  function goMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => goMonth(-1)}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {firstOfMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          onClick={() => goMonth(1)}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
        {WEEKDAY_LABELS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <span key={`b${i}`} />;
          const iso = toIso(viewYear, viewMonth, day);
          const disabled = isDisabled(iso);
          const isStart = iso === start;
          const isEnd = iso === end;
          const inRange = !!start && !!end && iso > start && iso < end;

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => handlePick(iso)}
              title={disabled ? "Already assigned to another member" : undefined}
              className={cn(
                "flex size-8 items-center justify-center rounded-md text-xs font-medium transition-colors",
                disabled && "cursor-not-allowed text-muted-foreground/30 line-through",
                !disabled && !isStart && !isEnd && !inRange && "text-foreground hover:bg-accent",
                inRange && "bg-accent text-accent-foreground",
                (isStart || isEnd) && "bg-primary text-primary-foreground"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
