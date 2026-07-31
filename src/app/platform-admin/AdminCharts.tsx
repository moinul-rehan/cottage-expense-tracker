"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Point = { label: string; value: number };

function niceMax(max: number) {
  if (max <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 2, 5, 10]) {
    if (max <= step * magnitude) return step * magnitude;
  }
  return 10 * magnitude;
}

const GRID_TICKS = [0, 0.25, 0.5, 0.75, 1];
const VIEW_W = 600;

/** Single-series area+line trend chart (e.g. cottage signups per month).
 * One series never needs a legend -- the card title already names it. */
export function TrendAreaChart({
  data,
  color = "var(--primary)",
  height = 220,
}: {
  data: Point[];
  color?: string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const padding = { top: 16, right: 8, bottom: 24, left: 8 };
  const innerW = VIEW_W - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + innerH - (d.value / max) * innerH,
    ...d,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${padding.top + innerH} L ${points[0].x} ${padding.top + innerH} Z`
    : "";
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${VIEW_W} ${height}`} className="w-full" role="img" aria-label="Trend over time">
        {GRID_TICKS.map((g) => (
          <line
            key={g}
            x1={padding.left}
            x2={VIEW_W - padding.right}
            y1={padding.top + innerH * g}
            y2={padding.top + innerH * g}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}
        {areaPath && <path d={areaPath} fill={color} opacity={0.1} stroke="none" />}
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <rect
            key={`hit-${i}`}
            x={p.x - stepX / 2}
            y={padding.top}
            width={Math.max(stepX, 1)}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {points.map(
          (p, i) =>
            (i === 0 || i === points.length - 1 || i % labelEvery === 0) && (
              <text key={`lbl-${i}`} x={p.x} y={height - 4} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">
                {p.label}
              </text>
            )
        )}
        {points.map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={hover === i ? 5 : 4}
            fill={color}
            stroke="var(--card)"
            strokeWidth={2}
          />
        ))}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[130%] rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md"
          style={{ left: `${(points[hover].x / VIEW_W) * 100}%`, top: `${(points[hover].y / height) * 100}%` }}
        >
          <p className="font-medium text-foreground">{points[hover].label}</p>
          <p className="tabular-nums text-muted-foreground">{points[hover].value.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

/** Single-series column chart (e.g. new users per month). */
export function TrendBarChart({
  data,
  color = "var(--chart-2)",
  height = 220,
}: {
  data: Point[];
  color?: string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const padding = { top: 16, right: 8, bottom: 24, left: 8 };
  const innerW = VIEW_W - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const slot = data.length ? innerW / data.length : innerW;
  const barW = Math.min(24, slot * 0.55);

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${VIEW_W} ${height}`} className="w-full" role="img" aria-label="Bar chart">
        {GRID_TICKS.map((g) => (
          <line
            key={g}
            x1={padding.left}
            x2={VIEW_W - padding.right}
            y1={padding.top + innerH * g}
            y2={padding.top + innerH * g}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}
        {data.map((d, i) => {
          const cx = padding.left + slot * i + slot / 2;
          const h = max > 0 ? (d.value / max) * innerH : 0;
          const y = padding.top + innerH - h;
          return (
            <g key={i}>
              <rect
                x={cx - barW / 2}
                y={y}
                width={barW}
                height={Math.max(h, 1)}
                rx={4}
                fill={color}
                opacity={hover === i ? 1 : 0.85}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              <rect
                x={cx - slot / 2}
                y={padding.top}
                width={slot}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              <text x={cx} y={height - 4} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[130%] rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md"
          style={{
            left: `${((padding.left + slot * hover + slot / 2) / VIEW_W) * 100}%`,
            top: `${((padding.top + innerH - (data[hover].value / max) * innerH) / height) * 100}%`,
          }}
        >
          <p className="font-medium text-foreground">{data[hover].label}</p>
          <p className="tabular-nums text-muted-foreground">{data[hover].value.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

export type DonutSlice = { label: string; value: number; color: string };

/** Status-breakdown donut. Colors are a validated status palette (not
 * decorative categorical hues) and every slice is direct-labeled in the
 * legend with its count + share, so identity never depends on color alone. */
export function StatusDonutChart({ slices, size = 168 }: { slices: DonutSlice[]; size?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const radius = size / 2;
  const stroke = radius * 0.34;
  const innerR = radius - stroke / 2;
  const circumference = 2 * Math.PI * innerR;

  const arcs = slices.reduce<Array<DonutSlice & { i: number; dash: number; gap: number; rotation: number }>>(
    (acc, s, i) => {
      const fraction = total > 0 ? s.value / total : 0;
      const dash = fraction * circumference;
      const offset = acc.length ? acc[acc.length - 1].rotation * (circumference / 360) + acc[acc.length - 1].dash : 0;
      acc.push({ ...s, i, dash, gap: circumference - dash, rotation: (offset / circumference) * 360 });
      return acc;
    },
    []
  );

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Status breakdown">
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx={radius}
              cy={radius}
              r={innerR}
              fill="none"
              stroke={a.color}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(a.dash - 2, 0)} ${a.gap + 2}`}
              strokeLinecap="round"
              transform={`rotate(${a.rotation - 90} ${radius} ${radius})`}
              opacity={hover === null || hover === a.i ? 1 : 0.35}
              onMouseEnter={() => setHover(a.i)}
              onMouseLeave={() => setHover(null)}
              className="cursor-pointer transition-opacity"
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular-nums text-foreground">
            {hover !== null ? arcs[hover].value : total}
          </span>
          <span className="text-[11px] text-muted-foreground">{hover !== null ? arcs[hover].label : "Total"}</span>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-2">
        {arcs.map((a) => (
          <li
            key={a.label}
            className={cn(
              "flex items-center justify-between gap-3 rounded-md px-1.5 py-1 text-sm transition-colors",
              hover === a.i && "bg-muted/60"
            )}
            onMouseEnter={() => setHover(a.i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="flex items-center gap-2 text-foreground">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: a.color }} />
              {a.label}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {a.value} · {total > 0 ? Math.round((a.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StatTile({
  label,
  value,
  delta,
  deltaGoodDirection = "up",
}: {
  label: string;
  value: string | number;
  delta?: number;
  deltaGoodDirection?: "up" | "down";
}) {
  const positive = (delta ?? 0) >= 0;
  const isGood = delta === undefined ? null : deltaGoodDirection === "up" ? positive : !positive;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border-[0.5px] border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#0e0e10]">
      <p className="text-sm text-black/60 dark:text-white/60">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-[26px] leading-none font-semibold">{value}</p>
        {delta !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 tabular-nums text-xs font-medium",
              isGood ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}
          >
            {positive ? "↑" : "↓"}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  );
}
