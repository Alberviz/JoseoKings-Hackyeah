"use client";

import { useMemo } from "react";
import { ParentBanner, PinGate } from "@/components/features/parent-mode";
import { Screen, Stack, Text } from "@/components/ui";
import { useAppState } from "@/hooks/useAppState";
import { useParentSession } from "@/hooks/useParentSession";
import { hasPin } from "@/lib/pin";
import { buildReport } from "@/lib/report";
import { loadWearableState } from "@/lib/storage/wearableStore";
import { BannerWrapper } from "./ReportScreen.style";
import { DoctorReportView } from "../DoctorReportView/DoctorReportView";

// The report shows health information entered by the family: it stays behind the parent PIN.
export function ReportScreen() {
  const { state, isReady } = useAppState();
  const session = useParentSession();

  const report = useMemo(
    () => (isReady ? buildReport(state, undefined, loadWearableState()) : null),
    [state, isReady],
  );

  if (!isReady || !report) {
    return (
      <Screen>
        <Stack align="center" gap="md">
          <Text tone="muted">Loading consultation summary...</Text>
        </Stack>
      </Screen>
    );
  }

  if (!state.child || !hasPin(state.settings)) {
    return (
      <Screen>
        <PinGate
          title="Setup needed"
          description="Parent mode requires a child profile and a 4-digit PIN."
        />
      </Screen>
    );
  }

  if (!session.isUnlocked) {
    return (
      <Screen>
        <PinGate
          title="Doctor report"
          description="Enter your 4-digit PIN to see the consultation summary."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <BannerWrapper>
        <ParentBanner
          section="more"
          icon="report"
          title="Doctor report"
          subtitle="Since the last visit"
        />
      </BannerWrapper>
      <DoctorReportView data={report} />
    </Screen>
  );
}
