"use client";

import { useState } from "react";
import { SectionCard } from "@/components/features/parent-mode";
import { Text } from "@/components/ui";
import { weekdayIndex } from "@/lib/dates";
import type { DaySummary } from "@/lib/patterns";
import {
  CalendarBody,
  CalendarGrid,
  CalendarHeader,
  DayCellButton,
  DayCellEmpty,
  DayInfoLabel,
  DayInfoRow,
  DayInfoValue,
  DayNumber,
  LegendContainer,
  LegendDot,
  LegendItem,
  LegendLabel,
  SelectedDayInfo,
  StatusDot,
  WeekdayHeader,
  type CalendarDayStatus,
} from "./ColourCalendar.style";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDayStatus(day: DaySummary): CalendarDayStatus {
  if (day.checkInStatus === "none") {
    return "no-data";
  }
  if (day.checkInStatus === "not-today") {
    return "not-today";
  }
  if (day.hasDiscomfort || (day.dayLevel !== null && day.dayLevel >= 2)) {
    return "discomfort";
  }
  if (day.dayLevel === 1) {
    return "mild";
  }
  return "calm";
}

function getStatusLabel(status: CalendarDayStatus): string {
  switch (status) {
    case "calm":
      return "Calm";
    case "mild":
      return "Mild discomfort";
    case "discomfort":
      return "Discomfort";
    case "not-today":
      return "Not today (skipped)";
    case "no-data":
    default:
      return "No check-in";
  }
}

interface ColourCalendarProps {
  summaries: DaySummary[];
}

export function ColourCalendar({ summaries }: ColourCalendarProps) {
  // Show the last 28 days
  const recentDays = summaries.slice(-28);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    recentDays.length > 0 ? recentDays[recentDays.length - 1].date : null,
  );

  const selectedDay = recentDays.find((d) => d.date === selectedDate);

  const countCalm = recentDays.filter(
    (d) => d.checkInStatus === "answered" && !d.hasDiscomfort && d.dayLevel === 0,
  ).length;
  const countMild = recentDays.filter(
    (d) => d.checkInStatus === "answered" && !d.hasDiscomfort && d.dayLevel === 1,
  ).length;
  const countDiscomfort = recentDays.filter(
    (d) => d.hasDiscomfort || (d.dayLevel !== null && d.dayLevel >= 2),
  ).length;
  const countSkipped = recentDays.filter((d) => d.checkInStatus === "not-today").length;

  const firstDay = recentDays[0];
  const leadingOffset = firstDay ? weekdayIndex(firstDay.date) : 0;

  return (
    <SectionCard section="patterns" title="Daily Well-Being Calendar">
      <CalendarBody>
        <CalendarHeader>
          <Text tone="muted">
            Summary of the last 28 days: {countCalm} calm days, {countMild} mild days,{" "}
            {countDiscomfort} days with discomfort, and {countSkipped} skipped check-ins.
          </Text>
        </CalendarHeader>

        <CalendarGrid role="grid" aria-label="Month well-being overview">
          {WEEKDAYS.map((day) => (
            <WeekdayHeader key={day} aria-hidden="true">
              {day}
            </WeekdayHeader>
          ))}

          {Array.from({ length: leadingOffset }).map((_, idx) => (
            <DayCellEmpty key={`empty-lead-${idx}`} aria-hidden="true" />
          ))}

          {recentDays.map((day) => {
            const dayNum = day.date.slice(-2);
            const isSelected = selectedDate === day.date;
            const status = getDayStatus(day);
            const statusText = getStatusLabel(status);

            return (
              <DayCellButton
                key={day.date}
                $status={status}
                $selected={isSelected}
                onClick={() => setSelectedDate(day.date)}
                type="button"
                aria-label={`${day.date}: ${statusText}`}
              >
                <DayNumber>{dayNum}</DayNumber>
                <StatusDot $status={status} aria-hidden="true" />
              </DayCellButton>
            );
          })}
        </CalendarGrid>

        {selectedDay && (
          <SelectedDayInfo aria-live="polite">
            <DayInfoRow>
              <DayInfoLabel>Date</DayInfoLabel>
              <DayInfoValue>{selectedDay.date}</DayInfoValue>
            </DayInfoRow>
            <DayInfoRow>
              <DayInfoLabel>Status</DayInfoLabel>
              <DayInfoValue>{getStatusLabel(getDayStatus(selectedDay))}</DayInfoValue>
            </DayInfoRow>
            {selectedDay.checkInStatus === "answered" && (
              <>
                <DayInfoRow>
                  <DayInfoLabel>Belly comfort</DayInfoLabel>
                  <DayInfoValue>
                    {selectedDay.bellyComfort !== null
                      ? `${selectedDay.bellyComfort} / 2`
                      : "Not recorded"}
                  </DayInfoValue>
                </DayInfoRow>
                <DayInfoRow>
                  <DayInfoLabel>Energy</DayInfoLabel>
                  <DayInfoValue>
                    {selectedDay.energy !== null ? `${selectedDay.energy} / 2` : "Not recorded"}
                  </DayInfoValue>
                </DayInfoRow>
                <DayInfoRow>
                  <DayInfoLabel>Play pace</DayInfoLabel>
                  <DayInfoValue>
                    {selectedDay.playPace !== null ? `${selectedDay.playPace} / 2` : "Not recorded"}
                  </DayInfoValue>
                </DayInfoRow>
              </>
            )}
            {selectedDay.sleepHours !== null && (
              <DayInfoRow>
                <DayInfoLabel>Sleep logged</DayInfoLabel>
                <DayInfoValue>{selectedDay.sleepHours} hours</DayInfoValue>
              </DayInfoRow>
            )}
            {selectedDay.missions.completed > 0 && (
              <DayInfoRow>
                <DayInfoLabel>Missions completed</DayInfoLabel>
                <DayInfoValue>{selectedDay.missions.completed}</DayInfoValue>
              </DayInfoRow>
            )}
            {selectedDay.missions.rest > 0 && (
              <DayInfoRow>
                <DayInfoLabel>Rest sessions</DayInfoLabel>
                <DayInfoValue>{selectedDay.missions.rest}</DayInfoValue>
              </DayInfoRow>
            )}
          </SelectedDayInfo>
        )}

        <LegendContainer aria-label="Calendar status legend">
          <LegendItem>
            <LegendDot $status="calm" aria-hidden="true" />
            <LegendLabel>Calm (0)</LegendLabel>
          </LegendItem>
          <LegendItem>
            <LegendDot $status="mild" aria-hidden="true" />
            <LegendLabel>Mild (1)</LegendLabel>
          </LegendItem>
          <LegendItem>
            <LegendDot $status="discomfort" aria-hidden="true" />
            <LegendLabel>Discomfort (2)</LegendLabel>
          </LegendItem>
          <LegendItem>
            <LegendDot $status="not-today" aria-hidden="true" />
            <LegendLabel>Not today</LegendLabel>
          </LegendItem>
          <LegendItem>
            <LegendDot $status="no-data" aria-hidden="true" />
            <LegendLabel>No check-in</LegendLabel>
          </LegendItem>
        </LegendContainer>
      </CalendarBody>
    </SectionCard>
  );
}
