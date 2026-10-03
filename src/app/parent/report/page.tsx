"use client";

import { useMemo } from "react";
import { Button, LinkButton, Screen, Stack, Text } from "@/components/ui";
import { DoctorReportView } from "@/components/features/doctor-report";
import { useAppState } from "@/hooks/useAppState";
import { buildDemoState } from "@/lib/demo-data";
import { buildReport } from "@/lib/report";
import { NavigationBar } from "./page.style";

export default function DoctorReportPage() {
  const { state, actions, isReady } = useAppState();

  const report = useMemo(() => {
    if (!isReady) return null;
    return buildReport(state);
  }, [state, isReady]);

  if (!isReady || !report) {
    return (
      <Screen>
        <Stack align="center" gap="md">
          <Text tone="muted">Loading consultation summary...</Text>
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen>
      <NavigationBar>
        <LinkButton href="/parent" variant="secondary">
          ← Back to Parent Mode
        </LinkButton>
        {state.checkIns.length === 0 && (
          <Button variant="secondary" onClick={() => actions.loadDemo(buildDemoState())}>
            Load Demo Data
          </Button>
        )}
      </NavigationBar>
      <DoctorReportView data={report} />
    </Screen>
  );
}
