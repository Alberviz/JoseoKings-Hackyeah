"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Screen, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { useAppState } from "@/hooks/useAppState";
import { useParentSession } from "@/hooks/useParentSession";
import { hasPin } from "@/lib/pin";
import { PinGate } from "../PinGate/PinGate";
import { SummaryCard } from "../SummaryCard/SummaryCard";
import { ParentHomeContainer } from "./ParentHomeScreen.style";

export function ParentHomeScreen() {
  const router = useRouter();
  const { state, isReady } = useAppState();
  const session = useParentSession();

  const hasConfiguredPin = hasPin(state.settings);

  useEffect(() => {
    if (!isReady) return;
    if (!state.child || !hasConfiguredPin) {
      router.replace(ROUTES.parentSetup);
    }
  }, [isReady, state.child, hasConfiguredPin, router]);

  if (!isReady) {
    return (
      <Screen>
        <ParentHomeContainer>
          <Text tone="muted">Loading parent mode...</Text>
        </ParentHomeContainer>
      </Screen>
    );
  }

  if (!state.child || !hasConfiguredPin) {
    return (
      <Screen>
        <ParentHomeContainer>
          <PinGate
            title="Setup needed"
            description="Parent mode requires a child profile and a 4-digit PIN."
          />
        </ParentHomeContainer>
      </Screen>
    );
  }

  if (!session.isUnlocked) {
    return (
      <Screen>
        <ParentHomeContainer>
          <PinGate />
        </ParentHomeContainer>
      </Screen>
    );
  }

  return (
    <Screen>
      <ParentHomeContainer>
        <SummaryCard state={state} onLock={session.lock} />
      </ParentHomeContainer>
    </Screen>
  );
}
