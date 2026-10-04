"use client";

import { Button } from "@/components/ui";
import { APP_NAME } from "@/config/app";
import type { DoctorReportData } from "@/lib/report/types";
import {
  ActivityConfidenceCard,
  ActivityConfidenceCount,
  ActivityConfidenceGrid,
  ActivityConfidenceLabel,
  ActivityOverview,
  DemoBadge,
  DisclaimerBanner,
  DisclaimerText,
  DisclaimerTitle,
  HeaderMetaRow,
  HeaderTitleGroup,
  HeaderTopRow,
  MetaItem,
  PrintGlobalStyle,
  ReportContainer,
  ReportHeader,
  ReportSection,
  ReportTitle,
  ScreenOnly,
  SectionNote,
  SectionTitle,
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

export type DoctorReportViewProps = {
  data: DoctorReportData;
};

export function DoctorReportView({ data }: DoctorReportViewProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

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

            <ScreenOnly>
              <Button onClick={handlePrint} variant="primary">
                Save as PDF / Print
              </Button>
            </ScreenOnly>
          </HeaderTopRow>
        </ReportHeader>

        {/* Section 1: Overview & Metrics */}
        <ReportSection aria-labelledby="section-overview">
          <SectionTitle id="section-overview">Overview & Metrics</SectionTitle>
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
          </ActivityOverview>
        </ReportSection>

        {/* Section 3: Daily strip / timeline */}
        <ReportSection aria-labelledby="section-timeline">
          <SectionTitle id="section-timeline">Daily strip / timeline</SectionTitle>
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

        {/* Section 4: Co-occurring foods on discomfort days */}
        <ReportSection aria-labelledby="section-foods">
          <SectionTitle id="section-foods">Co-occurring foods on discomfort days</SectionTitle>
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

        {/* Section 5: Mandatory disclaimer banner */}
        <DisclaimerBanner role="note" aria-label="Clinical disclaimer">
          <DisclaimerTitle>Mandatory Notice</DisclaimerTitle>
          <DisclaimerText>{data.disclaimer}</DisclaimerText>
        </DisclaimerBanner>
      </ReportContainer>
    </>
  );
}
