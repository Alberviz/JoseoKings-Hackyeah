"use client";

import { useState } from "react";
import { SectionCard } from "@/components/features/parent-mode";
import { Text } from "@/components/ui";
import type { WeekSummary } from "@/lib/patterns";
import type { AppTheme } from "@/theme/theme";
import {
  ChartBody,
  ChartHeader,
  ChartSvgWrapper,
  MetricTabButton,
  MetricTabs,
  SvgAxisLine,
  SvgCircle,
  SvgGroup,
  SvgLine,
  SvgRoot,
  SvgText,
  SvgTrendLine,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
  TableToggleButton,
} from "./WeeklyCharts.style";

type MetricKey = "belly" | "energy" | "playPace" | "sleep";

interface MetricConfig {
  label: string;
  shortLabel: string;
  minVal: number;
  maxVal: number;
  unit: string;
  colorToken: keyof AppTheme["colors"];
  getValue: (w: WeekSummary) => number | null;
  description: string;
}

const METRICS: Record<MetricKey, MetricConfig> = {
  belly: {
    label: "Belly comfort (0-2)",
    shortLabel: "Belly",
    minVal: 0,
    maxVal: 2,
    unit: "/ 2",
    colorToken: "urgent",
    getValue: (w) => w.bellyComfort,
    description:
      "Weekly average of self-reported belly comfort. 0 is calm, 2 is highest discomfort.",
  },
  energy: {
    label: "Energy battery (0-2)",
    shortLabel: "Energy",
    minVal: 0,
    maxVal: 2,
    unit: "/ 2",
    colorToken: "success",
    getValue: (w) => w.energy,
    description:
      "Weekly average of self-reported energy battery. Higher numbers reflect harder days.",
  },
  playPace: {
    label: "Play pace (0-2)",
    shortLabel: "Play",
    minVal: 0,
    maxVal: 2,
    unit: "/ 2",
    colorToken: "primary",
    getValue: (w) => w.playPace,
    description: "Weekly average of movement and play pace. Higher numbers reflect harder days.",
  },
  sleep: {
    label: "Sleep duration (hours)",
    shortLabel: "Sleep",
    minVal: 4,
    maxVal: 12,
    unit: "h",
    colorToken: "primaryHover",
    getValue: (w) => w.sleepHours,
    description: "Weekly average of nightly sleep hours logged by parents.",
  },
};

interface WeeklyChartsProps {
  series: WeekSummary[];
}

export function WeeklyCharts({ series }: WeeklyChartsProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("belly");
  const [showTable, setShowTable] = useState(false);

  const config = METRICS[activeMetric];

  // SVG Geometry
  const svgWidth = 380;
  const svgHeight = 200;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 35;

  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const validPoints = series
    .map((week, index) => {
      const val = config.getValue(week);
      return { week, index, val };
    })
    .filter((item): item is { week: WeekSummary; index: number; val: number } => item.val !== null);

  const getX = (index: number) => {
    if (series.length <= 1) return padLeft + plotWidth / 2;
    return padLeft + (index / (series.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const range = config.maxVal - config.minVal || 1;
    const clamped = Math.max(config.minVal, Math.min(config.maxVal, val));
    const normalized = (clamped - config.minVal) / range;
    return padTop + plotHeight - normalized * plotHeight;
  };

  const polylinePoints = validPoints
    .map(({ index, val }) => `${getX(index)},${getY(val)}`)
    .join(" ");

  // Y-axis gridlines
  const yTicks = [config.minVal, (config.minVal + config.maxVal) / 2, config.maxVal];

  const latestValid = validPoints.length > 0 ? validPoints[validPoints.length - 1].val : null;
  const summarySentence =
    latestValid !== null
      ? `Latest average is ${Math.round(latestValid * 10) / 10} ${config.unit}.`
      : "No data points recorded yet for this metric.";

  return (
    <SectionCard section="patterns" title="Weekly Trends">
      <ChartBody>
        <ChartHeader>
          <Text tone="muted">{config.description}</Text>
          <Text tone="muted">{summarySentence}</Text>
        </ChartHeader>

        <MetricTabs aria-label="Select metric to display">
          {(Object.keys(METRICS) as MetricKey[]).map((key) => (
            <MetricTabButton
              key={key}
              $active={activeMetric === key}
              onClick={() => setActiveMetric(key)}
              type="button"
            >
              {METRICS[key].shortLabel}
            </MetricTabButton>
          ))}
        </MetricTabs>

        <ChartSvgWrapper>
          <SvgRoot
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            role="img"
            aria-label={`Weekly trend chart for ${config.label}. ${summarySentence}`}
          >
            {/* Y Axis Gridlines */}
            {yTicks.map((tick) => {
              const yPos = getY(tick);
              return (
                <SvgGroup key={tick}>
                  <SvgLine x1={padLeft} y1={yPos} x2={svgWidth - padRight} y2={yPos} />
                  <SvgText x={padLeft - 8} y={yPos + 4} textAnchor="end">
                    {Math.round(tick * 10) / 10}
                    {config.unit.includes("h") ? "h" : ""}
                  </SvgText>
                </SvgGroup>
              );
            })}

            {/* Axes */}
            <SvgAxisLine
              x1={padLeft}
              y1={padTop + plotHeight}
              x2={svgWidth - padRight}
              y2={padTop + plotHeight}
            />
            <SvgAxisLine x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + plotHeight} />

            {/* Trend Polyline */}
            {polylinePoints && (
              <SvgTrendLine points={polylinePoints} $colorToken={config.colorToken} />
            )}

            {/* Data Circles & X-axis labels */}
            {validPoints.map(({ week, index, val }) => {
              const cx = getX(index);
              const cy = getY(val);
              const shortLabel = `W${index + 1}`;
              return (
                <SvgGroup key={week.weekStart}>
                  <SvgCircle
                    cx={cx}
                    cy={cy}
                    r={4.5}
                    $colorToken={config.colorToken}
                    aria-label={`Week of ${week.weekStart}: ${Math.round(val * 10) / 10} ${config.unit}`}
                  />
                  <SvgText x={cx} y={svgHeight - 10} textAnchor="middle">
                    {shortLabel}
                  </SvgText>
                </SvgGroup>
              );
            })}
          </SvgRoot>
        </ChartSvgWrapper>

        {/* Accessible Text Alternative Toggle */}
        <TableToggleButton type="button" onClick={() => setShowTable((prev) => !prev)}>
          {showTable ? "Hide data table" : "Show accessible data table"}
        </TableToggleButton>

        {showTable && (
          <TableContainer>
            <TableRoot aria-label={`Weekly data table for ${config.label}`}>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Week</TableHeaderCell>
                  <TableHeaderCell>Week Start</TableHeaderCell>
                  <TableHeaderCell>Average {config.shortLabel}</TableHeaderCell>
                  <TableHeaderCell>Answered Days</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {series.map((w, idx) => {
                  const val = config.getValue(w);
                  return (
                    <TableRow key={w.weekStart}>
                      <TableCell>W{idx + 1}</TableCell>
                      <TableCell>{w.weekStart}</TableCell>
                      <TableCell>
                        {val !== null ? `${Math.round(val * 10) / 10} ${config.unit}` : "No data"}
                      </TableCell>
                      <TableCell>{w.answeredDays}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </TableRoot>
          </TableContainer>
        )}
      </ChartBody>
    </SectionCard>
  );
}
