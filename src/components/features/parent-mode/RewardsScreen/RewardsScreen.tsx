"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Chip, Heading, Screen, Stack, Text } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { useAppState } from "@/hooks/useAppState";
import { useParentSession } from "@/hooks/useParentSession";
import { generateRewardId, SPECIAL_REWARDS_MAX } from "@/lib/economy";
import { hasPin } from "@/lib/pin";
import type { SpecialReward } from "@/types";
import { ParentBanner } from "../ParentBanner/ParentBanner";
import { PinGate } from "../PinGate/PinGate";
import { RewardForm } from "../RewardForm/RewardForm";
import { SectionCard } from "../SectionCard/SectionCard";
import { SECTION_BUTTON_VARIANT } from "../sections";
import {
  ItemActions,
  ItemInfo,
  ItemList,
  ItemRow,
  RewardsContainer,
  StatusMessage,
} from "./RewardsScreen.style";

const FALLBACK_REWARD_NAME = "A family reward";
const DONE_CLAIMS_SHOWN = 5;

export function RewardsScreen() {
  const router = useRouter();
  const { state, actions, isReady } = useAppState();
  const session = useParentSession();

  const [editingId, setEditingId] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();

  const hasConfiguredPin = hasPin(state.settings);
  const { specialRewards, rewardClaims } = state.economy;

  const rewardsById = useMemo(
    () => new Map(specialRewards.map((reward) => [reward.id, reward])),
    [specialRewards],
  );
  const requestedClaims = useMemo(
    () =>
      rewardClaims
        .filter((claim) => claim.status === "requested")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [rewardClaims],
  );
  const doneClaims = useMemo(
    () =>
      rewardClaims
        .filter((claim) => claim.status === "done")
        .sort((a, b) => (b.doneAt ?? b.date).localeCompare(a.doneAt ?? a.date))
        .slice(0, DONE_CLAIMS_SHOWN),
    [rewardClaims],
  );

  useEffect(() => {
    if (!isReady) return;
    if (!state.child || !hasConfiguredPin) {
      router.replace(ROUTES.parentSetup);
    }
  }, [isReady, state.child, hasConfiguredPin, router]);

  if (!isReady) {
    return (
      <Screen>
        <RewardsContainer>
          <Text tone="muted">Loading rewards...</Text>
        </RewardsContainer>
      </Screen>
    );
  }

  if (!state.child || !hasConfiguredPin) {
    return (
      <Screen>
        <RewardsContainer>
          <PinGate
            title="Setup needed"
            description="Parent mode requires a child profile and a 4-digit PIN."
          />
        </RewardsContainer>
      </Screen>
    );
  }

  if (!session.isUnlocked) {
    return (
      <Screen>
        <RewardsContainer>
          <PinGate />
        </RewardsContainer>
      </Screen>
    );
  }

  const childName = state.child.nickname.trim();
  const rewardName = (rewardId: string) => rewardsById.get(rewardId)?.name ?? FALLBACK_REWARD_NAME;

  const saveRewards = (next: SpecialReward[], successMessage: string) => {
    const result = actions.setSpecialRewards(next);
    setMessage(result.ok ? successMessage : "That reward could not be saved. Check the name.");
    return result.ok;
  };

  const handleAdd = (name: string, fireCost: number) => {
    saveRewards([...specialRewards, { id: generateRewardId(), name, fireCost }], "Reward added.");
  };

  const handleEdit = (rewardId: string, name: string, fireCost: number) => {
    const saved = saveRewards(
      specialRewards.map((reward) =>
        reward.id === rewardId ? { ...reward, name, fireCost } : reward,
      ),
      "Reward updated.",
    );
    if (saved) setEditingId(undefined);
  };

  const handleRemove = (rewardId: string) => {
    saveRewards(
      specialRewards.filter((reward) => reward.id !== rewardId),
      "Reward removed.",
    );
    if (editingId === rewardId) setEditingId(undefined);
  };

  const handleConfirm = (claimId: string) => {
    actions.markClaimDone(claimId);
    setMessage("Marked as given.");
  };

  return (
    <Screen>
      <RewardsContainer>
        <Stack gap="lg">
          <ParentBanner
            section="more"
            icon="child"
            title="Family rewards"
            subtitle="Rewards from home, agreed together"
          />

          {message ? <StatusMessage role="status">{message}</StatusMessage> : null}

          <SectionCard section="more" title="Waiting for you">
            <Stack gap="md">
              <Text size="sm" tone="muted">
                {`${childName} spends dragon fire to ask for a reward. Confirm it when it happens. The fire was already spent, so confirming does not change anything for the dragon.`}
              </Text>
              {requestedClaims.length === 0 ? (
                <Text tone="muted">No requests right now.</Text>
              ) : (
                <ItemList aria-label="Requested rewards">
                  {requestedClaims.map((claim) => (
                    <ItemRow key={claim.id}>
                      <ItemInfo>
                        <Text>{rewardName(claim.rewardId)}</Text>
                        <Chip label={`Asked on ${claim.date}`} tone="primary" />
                      </ItemInfo>
                      <ItemActions>
                        <Button
                          variant={SECTION_BUTTON_VARIANT.more}
                          aria-label={`Confirm ${rewardName(claim.rewardId)} was given`}
                          onClick={() => handleConfirm(claim.id)}
                        >
                          Confirm it was given
                        </Button>
                      </ItemActions>
                    </ItemRow>
                  ))}
                </ItemList>
              )}
              {doneClaims.length > 0 ? (
                <Stack gap="sm">
                  <Heading level={3}>Given recently</Heading>
                  <ItemList aria-label="Rewards given recently">
                    {doneClaims.map((claim) => (
                      <ItemRow key={claim.id}>
                        <ItemInfo>
                          <Text>{rewardName(claim.rewardId)}</Text>
                          <Chip label={`Given on ${claim.doneAt ?? claim.date}`} tone="success" />
                        </ItemInfo>
                      </ItemRow>
                    ))}
                  </ItemList>
                </Stack>
              ) : null}
            </Stack>
          </SectionCard>

          <SectionCard section="more" title="Reward list">
            <Stack gap="md">
              <Text size="sm" tone="muted">
                Rewards are for the steady act of taking part, never for what your child answered.
                Prices are the same every day. Think of time and activities together. To change a
                reward, edit or remove it here before it is asked for.
              </Text>
              {specialRewards.length === 0 ? (
                <Text tone="muted">No rewards yet. Add the first one below.</Text>
              ) : (
                <ItemList aria-label="Special rewards">
                  {specialRewards.map((reward) =>
                    editingId === reward.id ? (
                      <ItemRow key={reward.id}>
                        <RewardForm
                          initialName={reward.name}
                          initialCost={reward.fireCost}
                          submitLabel="Save reward"
                          onSubmit={(name, fireCost) => handleEdit(reward.id, name, fireCost)}
                          onCancel={() => setEditingId(undefined)}
                        />
                      </ItemRow>
                    ) : (
                      <ItemRow key={reward.id}>
                        <ItemInfo>
                          <Text>{reward.name}</Text>
                          <Chip label={`${reward.fireCost} fire`} tone="mixed" />
                        </ItemInfo>
                        <ItemActions>
                          <Button
                            variant="secondary"
                            aria-label={`Edit ${reward.name}`}
                            onClick={() => setEditingId(reward.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            aria-label={`Remove ${reward.name}`}
                            onClick={() => handleRemove(reward.id)}
                          >
                            Remove
                          </Button>
                        </ItemActions>
                      </ItemRow>
                    ),
                  )}
                </ItemList>
              )}
            </Stack>
          </SectionCard>

          <SectionCard section="more" title="Add a reward">
            {specialRewards.length >= SPECIAL_REWARDS_MAX ? (
              <Text tone="muted">
                {`The list is full (${SPECIAL_REWARDS_MAX} rewards). Remove one to add another.`}
              </Text>
            ) : (
              <RewardForm submitLabel="Add reward" onSubmit={handleAdd} />
            )}
          </SectionCard>
        </Stack>
      </RewardsContainer>
    </Screen>
  );
}
