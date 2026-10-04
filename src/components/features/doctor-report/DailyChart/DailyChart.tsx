"use client";

import {
  ChartCaption,
  ChartDot,
  ChartFigure,
  ChartLine,
  ChartRange,
  ChartTitle,
  ChartSvg,
  MarkerDot,
} from "./DailyChart.style";

export type DailyChartProps = {
  title: string;
  unit: string;
  /** One value per day; null when there is none. */
  values: (number | null)[];
  /** Same length as values: true on days to mark (discomfort). */
  markers: boolean[];
};

const WIDTH = 300;
const HEIGHT = 56;
const PAD = 6;
const MARKER_Y = HEIGHT - 3;

export function DailyChart({ title, unit, values, markers }: DailyChartProps) {
  const present = values.filter((v): v is number => v !== null);
  const min = present.length > 0 ? Math.min(...present) : 0;
  const max = present.length > 0 ? Math.max(...present) : 0;
  const span = max - min || 1;
  const step = values.length > 1 ? (WIDTH - PAD * 2) / (values.length - 1) : 0;
  const xAt = (i: number) => PAD + i * step;
  const yAt = (v: number) => PAD + (1 - (v - min) / span) * (HEIGHT - PAD * 2 - 6);

  let path = "";
  let previousPresent = false;
  const dots: { x: number; y: number; key: number }[] = [];
  values.forEach((v, i) => {
    if (v === null) {
      previousPresent = false;
      return;
    }
    const x = xAt(i);
    const y = yAt(v);
    path += `${previousPresent ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)} `;
    previousPresent = true;
    dots.push({ x, y, key: i });
  });

  const markedDays = markers.filter(Boolean).length;
  const label =
    present.length === 0
      ? `${title}: no data`
      : `${title}: ${present.length} days, from ${min} to ${max} ${unit}, ${markedDays} days with discomfort marked`;

  return (
    <ChartFigure>
      <ChartCaption>
        <ChartTitle>{title}</ChartTitle>
        <ChartRange>{present.length === 0 ? "no data" : `${min} to ${max} ${unit}`}</ChartRange>
      </ChartCaption>
      <ChartSvg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
      >
        <ChartLine d={path} />
        {dots.map((d) => (
          <ChartDot key={d.key} cx={d.x} cy={d.y} r={1.8} />
        ))}
        {markers.map((on, i) =>
          on ? <MarkerDot key={`m${i}`} cx={xAt(i)} cy={MARKER_Y} r={2.2} /> : null,
        )}
      </ChartSvg>
    </ChartFigure>
  );
}
