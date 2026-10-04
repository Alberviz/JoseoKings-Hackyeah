"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LinkButton, Screen, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { useAppState } from "@/hooks/useAppState";
import { useParentSession } from "@/hooks/useParentSession";
import { hasPin } from "@/lib/pin";
import { PinGate } from "../PinGate/PinGate";
import { SectionCard } from "../SectionCard/SectionCard";
import { SECTION_BUTTON_VARIANT } from "../sections";
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

  const pendingClaims = state.economy.rewardClaims.filter(
    (claim) => claim.status === "requested",
  ).length;

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
        <Stack gap="lg">
          <SummaryCard state={state} />
          <SectionCard section="more" title="Family rewards">
            <Stack gap="md">
              <Text size="sm" tone="muted">
                {pendingClaims > 0
                  ? `${pendingClaims} ${pendingClaims === 1 ? "request is" : "requests are"} waiting for you.`
                  : "Set the rewards from home and confirm the ones your child asks for."}
              </Text>
              <LinkButton
                href={ROUTES.parentRewards}
                variant={SECTION_BUTTON_VARIANT.more}
                fullWidth
              >
                Family rewards
              </LinkButton>
            </Stack>
          </SectionCard>
        </Stack>
      </ParentHomeContainer>
    </Screen>
  );
}
