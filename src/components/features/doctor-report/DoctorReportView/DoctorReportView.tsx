"use client";

import { SECTION_BUTTON_VARIANT } from "@/components/features/parent-mode";
import { Button } from "@/components/ui";
import { DailyChart } from "../DailyChart/DailyChart";
import { APP_NAME } from "@/config/app";
import { WEARABLE_METHOD_NOTE_TITLE } from "@/lib/report/sections";
import type { DoctorReportData, WearableMetricSummary } from "@/lib/report/types";
import {
  ActivityConfidenceCard,
  ActivityConfidenceCount,
  ActivityConfidenceGrid,
  ActivityConfidenceLabel,
  ActivityOverview,
  ChartsGrid,
  DemoBadge,
  DisclaimerBanner,
  DisclaimerText,
  DisclaimerTitle,
  HeaderMetaRow,
  HeaderTitleGroup,
  HeaderTopRow,
  MetaItem,
  MethodNote,
  MethodNoteTitle,
  MethodText,
  PrintGlobalStyle,
  ReportContainer,
  ReportHeader,
  ReportSection,
  ReportTitle,
  ScreenOnly,
  SectionNote,
  SectionTitle,
  SourceTag,
  StatCard,
  StatDetail,
  StatLabel,
  StatsGrid,
  StatValue,
  StrongText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableEmptyCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TotalMissionsBadge,
  TotalMissionsHighlight,
} from "./DoctorReportView.style";

function formatMedian(metric: WearableMetricSummary, unit: string): string {
  return metric.median === null ? "—" : `${metric.median} ${unit}`;
}

function formatRange(metric: WearableMetricSummary, unit: string): string {
  return metric.q1 === null || metric.q3 === null ? "—" : `${metric.q1} to ${metric.q3} ${unit}`;
}

export type DoctorReportViewProps = {
  data: DoctorReportData;
};

export function DoctorReportView({ data }: DoctorReportViewProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const restingHrLabel =
    data.wearable.restingHrSource === "wearable-daily"
      ? "Resting HR (reported by the wearable)"
      : data.wearable.restingHrSource === "mixed"
        ? "Resting HR"
        : "Nocturnal resting HR";

  const adherencePercentage = Math.round(
    data.metrics.checkInCompletionRate > 1
      ? data.metrics.checkInCompletionRate
      : data.metrics.checkInCompletionRate * 100,
  );

  return (
    <>
      <PrintGlobalStyle />
      <ReportContainer>
        {/* Header */}
        <ReportHeader>
          <HeaderTopRow>
            <HeaderTitleGroup>
              <ReportTitle>{APP_NAME} · Consultation Summary</ReportTitle>
              <HeaderMetaRow>
                <MetaItem>
                  Child: <StrongText>{data.childNickname}</StrongText>
                </MetaItem>
                <MetaItem>
                  From {data.period.startDate} to {data.period.endDate} ({data.period.totalDays}{" "}
                  days)
                </MetaItem>
                {data.period.previousConsultationDate && (
                  <MetaItem>Previous consultation: {data.period.previousConsultationDate}</MetaItem>
                )}
                {data.period.nextAppointmentDate && (
                  <MetaItem>Next appointment: {data.period.nextAppointmentDate}</MetaItem>
                )}
                {data.isDemo && <DemoBadge>Demo data</DemoBadge>}
              </HeaderMetaRow>
            </HeaderTitleGroup>
          </HeaderTopRow>
        </ReportHeader>

        {/* Section 1: Overview & Metrics */}
        <ReportSection aria-labelledby="section-overview">
          <SectionTitle id="section-overview">Overview & Metrics</SectionTitle>
          <SourceTag>Source: Child and Family</SourceTag>
          <StatsGrid>
            <StatCard>
              <StatLabel>Check-in consistency</StatLabel>
              <StatValue>{adherencePercentage}%</StatValue>
              <StatDetail>
                {data.metrics.checkInDaysCount} of {data.period.totalDays} days
              </StatDetail>
            </StatCard>

            <StatCard>
              <StatLabel>Care days</StatLabel>
              <StatValue>{data.metrics.careDaysCount}</StatValue>
              <StatDetail>days active (check-in or mission)</StatDetail>
            </StatCard>

            <StatCard>
              <StatLabel>Days with discomfort</StatLabel>
              <StatValue>{data.metrics.discomfortDaysCount}</StatValue>
              <StatDetail>
                {data.metrics.discomfortDaysCount === 1
                  ? "1 day"
                  : `${data.metrics.discomfortDaysCount} days`}{" "}
                reported
              </StatDetail>
            </StatCard>

            <StatCard>
              <StatLabel>Average sleep</StatLabel>
              <StatValue>
                {data.metrics.avgSleepHours !== null
                  ? `${data.metrics.avgSleepHours.toFixed(1)} h`
                  : "—"}
              </StatValue>
              <StatDetail>
                {data.metrics.avgSleepHours !== null
                  ? `${data.metrics.sleepRecordedDaysCount} days logged`
                  : "No sleep logged"}
              </StatDetail>
            </StatCard>

            <StatCard>
              <StatLabel>School days impacted</StatLabel>
              <StatValue>{data.metrics.schoolImpactedDaysCount}</StatValue>
              <StatDetail>
                {data.metrics.schoolImpactedDaysCount === 1
                  ? "1 day"
                  : `${data.metrics.schoolImpactedDaysCount} days`}{" "}
                affected
              </StatDetail>
            </StatCard>
          </StatsGrid>
        </ReportSection>

        {/* Section 2: Physical Movement & Activity */}
        <ReportSection aria-labelledby="section-activity">
          <SectionTitle id="section-activity">Physical Movement & Activity</SectionTitle>
          <SourceTag>Source: Child (missions)</SourceTag>
          <ActivityOverview>
            <TotalMissionsBadge>
              Total completed missions:{" "}
              <TotalMissionsHighlight>
                {data.activity.totalMissionsCompleted}
              </TotalMissionsHighlight>
            </TotalMissionsBadge>

            <ActivityConfidenceGrid>
              {data.activity.byConfidence.map((conf) => (
                <ActivityConfidenceCard key={conf.company || conf.label}>
                  <ActivityConfidenceLabel>{conf.label}</ActivityConfidenceLabel>
                  <ActivityConfidenceCount>
                    {conf.count} {conf.count === 1 ? "mission" : "missions"}
                  </ActivityConfidenceCount>
                </ActivityConfidenceCard>
              ))}
            </ActivityConfidenceGrid>

            {data.activity.byCorroboration && data.activity.byCorroboration.length > 0 && (
              <ActivityConfidenceGrid>
                {data.activity.byCorroboration.map((corrob) => (
                  <ActivityConfidenceCard key={corrob.method}>
                    <ActivityConfidenceLabel>{corrob.label}</ActivityConfidenceLabel>
                    <ActivityConfidenceCount>
                      {corrob.count} {corrob.count === 1 ? "mission" : "missions"}
                    </ActivityConfidenceCount>
                  </ActivityConfidenceCard>
                ))}
              </ActivityConfidenceGrid>
            )}
          </ActivityOverview>
        </ReportSection>

        {/* Section 3: Wearable data */}
        <ReportSection aria-labelledby="section-wearable">
          <SectionTitle id="section-wearable">Wearable data</SectionTitle>
          <SourceTag>
            {data.wearable.deviceLabels.length > 0
              ? `${data.wearable.source}: ${data.wearable.deviceLabels.join(", ")}`
              : data.wearable.source}
          </SourceTag>
          {data.wearable.isDemo && <DemoBadge>Demo data</DemoBadge>}
          {data.wearable.validDays === 0 ? (
            <SectionNote>No data from the wearable in this period.</SectionNote>
          ) : (
            <>
              <SectionNote>
                Median and middle half (interquartile range) of the days with enough data. Valid
                days: {data.wearable.validDays} of {data.period.totalDays}. Measured by the
                wearable, not checked clinically.
                {data.wearable.restingHrSource === "wearable-daily"
                  ? " Resting heart rate as reported by the wearable."
                  : null}
                {data.wearable.restingHrSource === "mixed"
                  ? " Resting heart rate is from night readings on some days and as reported by the wearable on others."
                  : null}
              </SectionNote>
              <TableContainer>
                <Table aria-label="Wearable data summary">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell scope="col">Measure</TableHeaderCell>
                      <TableHeaderCell scope="col">Median</TableHeaderCell>
                      <TableHeaderCell scope="col">Middle half</TableHeaderCell>
                      <TableHeaderCell scope="col">Valid days (N)</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(
                      [
                        ["Steps per day", data.wearable.steps, "steps"],
                        [restingHrLabel, data.wearable.restingHr, "bpm"],
                        ["Sleep duration", data.wearable.sleepHours, "h"],
                      ] as const
                    ).map(([label, metric, unit]) => (
                      <TableRow key={label}>
                        <TableCell>
                          {label}
                          {label === restingHrLabel && data.wearable.restingHrMethodText ? (
                            <MethodText>{data.wearable.restingHrMethodText}</MethodText>
                          ) : null}
                        </TableCell>
                        <TableCell>{formatMedian(metric, unit)}</TableCell>
                        <TableCell>{formatRange(metric, unit)}</TableCell>
                        <TableCell>{metric.n}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <ChartsGrid>
                <DailyChart
                  title="Steps per day"
                  unit="steps"
                  values={data.wearable.series.map((p) => p.steps)}
                  markers={data.dayStrip.map((d) => d.hadDiscomfort)}
                />
                <DailyChart
                  title={restingHrLabel}
                  unit="bpm"
                  values={data.wearable.series.map((p) => p.restingHr)}
                  markers={data.dayStrip.map((d) => d.hadDiscomfort)}
                />
                <DailyChart
                  title="Sleep duration"
                  unit="h"
                  values={data.wearable.series.map((p) => p.sleepHours)}
                  markers={data.dayStrip.map((d) => d.hadDiscomfort)}
                />
              </ChartsGrid>
              <SectionNote>
                Orange marks show days the child marked discomfort. Each chart covers the whole
                period.
              </SectionNote>
              <MethodNote aria-labelledby="wearable-method-title">
                <MethodNoteTitle id="wearable-method-title">
                  {WEARABLE_METHOD_NOTE_TITLE}
                </MethodNoteTitle>
                {data.wearable.methodNote.map((paragraph) => (
                  <SectionNote key={paragraph}>{paragraph}</SectionNote>
                ))}
              </MethodNote>
            </>
          )}
        </ReportSection>

        {/* Cross comparison for the clinician */}
        <ReportSection aria-labelledby="section-cross">
          <SectionTitle id="section-cross">Child, family and wearable together</SectionTitle>
          <SourceTag>Source: Child, Family and Wearable</SourceTag>
          {data.wearable.isDemo && <DemoBadge>Demo data</DemoBadge>}
          {data.crossComparison.length === 0 ? (
            <SectionNote>
              Not enough days with both a child or family entry and a wearable value (at least 14
              needed).
            </SectionNote>
          ) : (
            <>
              <SectionNote>
                For the clinician: Spearman rank correlation (rho, from -1 to 1) per day, with a 95%
                bootstrap interval and the number of paired days (N). It shows whether two series
                move together. It does not show cause.
              </SectionNote>
              <TableContainer>
                <Table aria-label="Child, family and wearable comparison">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell scope="col">Entered by</TableHeaderCell>
                      <TableHeaderCell scope="col">Signal</TableHeaderCell>
                      <TableHeaderCell scope="col">Wearable value</TableHeaderCell>
                      <TableHeaderCell scope="col">N</TableHeaderCell>
                      <TableHeaderCell scope="col">rho</TableHeaderCell>
                      <TableHeaderCell scope="col">95% interval</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.crossComparison.map((row) => (
                      <TableRow key={`${row.signal}-${row.metric}`}>
                        <TableCell>{row.source}</TableCell>
                        <TableCell>{row.signal}</TableCell>
                        <TableCell>{row.metric}</TableCell>
                        <TableCell>{row.n}</TableCell>
                        <TableCell>{row.rho}</TableCell>
                        <TableCell>
                          {row.low} to {row.high}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </ReportSection>

        {/* Section 4: Observed by the family */}
        <ReportSection aria-labelledby="section-observed">
          <SectionTitle id="section-observed">Observed by the family</SectionTitle>
          <SourceTag>Source: Family</SourceTag>
          {data.observed.loggedDays === 0 ? (
            <SectionNote>No daily notes from the family in this period.</SectionNote>
          ) : (
            <>
              <SectionNote>
                Day counts from the family daily log ({data.observed.loggedDays} days logged).
              </SectionNote>
              <TableContainer>
                <Table aria-label="Observed by the family">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell scope="col">Item</TableHeaderCell>
                      <TableHeaderCell scope="col">Days</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(
                      [
                        ["School: attended", `${data.observed.school.attended}`],
                        ["School: left early", `${data.observed.school.leftEarly}`],
                        ["School: missed", `${data.observed.school.missed}`],
                        ["School: no school that day", `${data.observed.school.noSchool}`],
                        ["Medication: taken", `${data.observed.medication.yes}`],
                        ["Medication: partly taken", `${data.observed.medication.partly}`],
                        ["Medication: not taken", `${data.observed.medication.no}`],
                        ["Medication: not applicable", `${data.observed.medication.notApplicable}`],
                        ...(data.observed.bathroom
                          ? [
                              [
                                "Bathroom: daytime visits",
                                data.observed.bathroom.avgDaytimePerDay !== null
                                  ? `${data.observed.bathroom.totalDaytime} total (avg ${data.observed.bathroom.avgDaytimePerDay.toFixed(1)}/day)`
                                  : `${data.observed.bathroom.totalDaytime} total`,
                              ],
                              [
                                "Bathroom: nighttime visits",
                                data.observed.bathroom.avgNighttimePerDay !== null
                                  ? `${data.observed.bathroom.totalNighttime} total (avg ${data.observed.bathroom.avgNighttimePerDay.toFixed(1)}/day)`
                                  : `${data.observed.bathroom.totalNighttime} total`,
                              ],
                              [
                                "Bathroom: total visits",
                                data.observed.bathroom.avgVisitsPerDay !== null
                                  ? `${data.observed.bathroom.totalVisits} total (avg ${data.observed.bathroom.avgVisitsPerDay.toFixed(1)}/day)`
                                  : `${data.observed.bathroom.totalVisits} total`,
                              ],
                              [
                                "Bathroom: looser stools reported",
                                `${data.observed.bathroom.daysWithLooserStools} ${
                                  data.observed.bathroom.daysWithLooserStools === 1 ? "day" : "days"
                                }`,
                              ],
                              [
                                "Bathroom: visible blood reported",
                                `${data.observed.bathroom.daysWithBloodVisible} ${
                                  data.observed.bathroom.daysWithBloodVisible === 1 ? "day" : "days"
                                }`,
                              ],
                            ]
                          : []),
                      ] as const
                    ).map(([label, count]) => (
                      <TableRow key={label}>
                        <TableCell>
                          {label}
                          {label === restingHrLabel && data.wearable.restingHrMethodText ? (
                            <MethodText>{data.wearable.restingHrMethodText}</MethodText>
                          ) : null}
                        </TableCell>
                        <TableCell>{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </ReportSection>

        {/* Section 5: Daily strip / timeline */}
        <ReportSection aria-labelledby="section-timeline">
          <SectionTitle id="section-timeline">Daily strip / timeline</SectionTitle>
          <SourceTag>Source: Child</SourceTag>
          <TableContainer>
            <Table aria-label="Daily check-in and activity timeline">
              <TableHead>
                <TableRow>
                  <TableHeaderCell scope="col">Date</TableHeaderCell>
                  <TableHeaderCell scope="col">Belly comfort</TableHeaderCell>
                  <TableHeaderCell scope="col">Energy</TableHeaderCell>
                  <TableHeaderCell scope="col">Play pace</TableHeaderCell>
                  <TableHeaderCell scope="col">Care active</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.dayStrip.length === 0 ? (
                  <TableRow>
                    <TableEmptyCell colSpan={5}>
                      No daily records found in this period.
                    </TableEmptyCell>
                  </TableRow>
                ) : (
                  data.dayStrip.map((entry) => {
                    const formatScore = (val: number | null) => {
                      if (val !== null) return `${val}`;
                      if (entry.notToday) return "Not today";
                      return "—";
                    };

                    const careActive = entry.hadMissions || entry.hasCheckIn ? "Yes" : "No";

                    return (
                      <TableRow key={entry.date}>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{formatScore(entry.bellyComfort)}</TableCell>
                        <TableCell>{formatScore(entry.energy)}</TableCell>
                        <TableCell>{formatScore(entry.playPace)}</TableCell>
                        <TableCell>{careActive}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </ReportSection>

        {/* Section 6: Co-occurring foods on discomfort days */}
        <ReportSection aria-labelledby="section-foods">
          <SectionTitle id="section-foods">Co-occurring foods on discomfort days</SectionTitle>
          <SourceTag>Source: Family</SourceTag>
          <SectionNote>
            The family logged these foods on days when discomfort was reported (co-occurrence counts
            only, not ranked as causes).
          </SectionNote>

          {data.foodsOnDiscomfortDays && data.foodsOnDiscomfortDays.length > 0 ? (
            <TableContainer>
              <Table aria-label="Co-occurring foods on discomfort days">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell scope="col">Food item</TableHeaderCell>
                    <TableHeaderCell scope="col">Times logged</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.foodsOnDiscomfortDays.map((item) => (
                    <TableRow key={item.text}>
                      <TableCell>{item.text}</TableCell>
                      <TableCell>
                        {item.count} {item.count === 1 ? "day" : "days"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <SectionNote>
              No food entries were logged on days with discomfort during this period.
            </SectionNote>
          )}
        </ReportSection>

        {/* Section 7: Mandatory disclaimer banner */}
        <DisclaimerBanner role="note" aria-label="Clinical disclaimer">
          <DisclaimerTitle>Mandatory Notice</DisclaimerTitle>
          <DisclaimerText>{data.disclaimer}</DisclaimerText>
        </DisclaimerBanner>

        <ScreenOnly>
          <Button fullWidth onClick={handlePrint} variant={SECTION_BUTTON_VARIANT.more}>
            Save as PDF / Print
          </Button>
        </ScreenOnly>
      </ReportContainer>
    </>
  );
}
