"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Chip,
  Dialog,
  Heading,
  LinkButton,
  OptionButton,
  OptionGroup,
  Screen,
  Stack,
  Text,
} from "@/components/ui";
import { ROUTES } from "@/config/app";
import { useAppState } from "@/hooks/useAppState";
import { useFamilyLink } from "@/hooks/useFamilyLink";
import { addDays, todayKey } from "@/lib/dates";
import {
  buildSharePayload,
  decodePairing,
  encodeShare,
  isLinkCryptoAvailable,
  isPairingCode,
  SHARE_RANGE_DAYS,
  type FamilyLink,
  type LinkRewardClaim,
  type ShareRangeDays,
} from "@/lib/link";
import type { CheckIn, DateKey, MissionLog } from "@/types";
import { CopyCodeButton } from "../CopyCodeButton/CopyCodeButton";
import { describeLinkError } from "../linkMessages";
import { QrDisplay } from "../QrDisplay/QrDisplay";
import { QrScanner, type ScanFeedback } from "../QrScanner/QrScanner";
import { ActionRow, LinkedBadge, ShareContainer, StepItem, StepList } from "./ShareScreen.style";

type BuildInput = {
  link: FamilyLink;
  checkIns: CheckIn[];
  missionLogs: MissionLog[];
  rewardClaims: LinkRewardClaim[];
  from: DateKey;
  to: DateKey;
};

type BuildResult = {
  input: BuildInput;
  frames: string[];
  error: string | null;
};

/** Child side of the family link: scan the pairing code once, then show data codes when asked. */
export function ShareScreen() {
  const { state, actions, isReady } = useAppState();
  const family = useFamilyLink();

  const [feedback, setFeedback] = useState<ScanFeedback | undefined>(undefined);
  const [rangeDays, setRangeDays] = useState<ShareRangeDays>(7);
  // The built code is stored with the input it was built from: a different input means "building".
  const [build, setBuild] = useState<BuildResult | null>(null);
  const [isForgetOpen, setIsForgetOpen] = useState(false);

  const link = family.link;
  const cryptoAvailable = isLinkCryptoAvailable();

  const handlePairingCode = useCallback(
    (text: string) => {
      if (!isPairingCode(text)) {
        setFeedback({
          tone: "urgent",
          message: "That is not a pairing code. Ask your parents to open Family link.",
        });
        return;
      }
      try {
        const pairing = decodePairing(text);
        family.setLink({
          role: "child",
          familyId: pairing.familyId,
          keyB64: pairing.keyB64,
          nickname: pairing.nickname,
          allowedMissionIds: pairing.allowedMissionIds,
          specialRewards: pairing.specialRewards,
          rewardClaims: [],
          linkedAt: new Date().toISOString(),
        });
        if (!state.child && pairing.nickname.trim().length > 0) {
          actions.setChild({ nickname: pairing.nickname });
        }
        setFeedback({ tone: "success", message: "Linked. This phone now knows your family." });
      } catch (error) {
        setFeedback({ tone: "urgent", message: describeLinkError(error, "child") });
      }
    },
    [actions, family, state.child],
  );

  const range = useMemo(() => {
    const to = todayKey();
    return { from: addDays(to, -(rangeDays - 1)), to };
  }, [rangeDays]);

  const input = useMemo<BuildInput | null>(
    () =>
      link && isReady && cryptoAvailable
        ? {
            link,
            checkIns: state.checkIns,
            missionLogs: state.missionLogs,
            rewardClaims: state.economy.rewardClaims,
            from: range.from,
            to: range.to,
          }
        : null,
    [
      link,
      isReady,
      cryptoAvailable,
      state.checkIns,
      state.missionLogs,
      state.economy.rewardClaims,
      range,
    ],
  );

  useEffect(() => {
    if (!input) {
      return;
    }
    let isCancelled = false;
    const payload = buildSharePayload(
      {
        familyId: input.link.familyId,
        checkIns: input.checkIns,
        missionLogs: input.missionLogs,
        rewardClaims: input.rewardClaims,
      },
      input.from,
      input.to,
    );
    encodeShare(payload, input.link.keyB64)
      .then((frames) => {
        if (!isCancelled) {
          setBuild({ input, frames, error: null });
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setBuild({
            input,
            frames: [],
            error: "The code could not be prepared. Try a shorter range.",
          });
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [input]);

  const isCurrentBuild = build !== null && build.input === input;
  const frames = isCurrentBuild ? build.frames : [];
  const buildError = isCurrentBuild ? build.error : null;
  const isBuilding = input !== null && !isCurrentBuild;

  if (!isReady || !family.isReady) {
    return (
      <Screen>
        <ShareContainer>
          <Text tone="muted">Loading...</Text>
        </ShareContainer>
      </Screen>
    );
  }

  if (!cryptoAvailable) {
    return (
      <Screen>
        <ShareContainer>
          <Heading level={1}>Share with your parents</Heading>
          <Text tone="urgent">
            Sharing needs a secure connection (HTTPS or localhost). Open the app from its installed
            icon or its https address.
          </Text>
          <LinkButton href={ROUTES.home} variant="secondary" fullWidth>
            Back home
          </LinkButton>
        </ShareContainer>
      </Screen>
    );
  }

  if (!link) {
    return (
      <Screen>
        <ShareContainer>
          <Stack gap="xs">
            <Heading level={1}>Connect with your parents&apos; phone</Heading>
            <Text tone="muted">
              One scan, once. After that, your phone can show your parents what you marked, with no
              internet and no account.
            </Text>
          </Stack>
          <Card label="How it works">
            <StepList>
              <StepItem>A parent opens Family link on their phone.</StepItem>
              <StepItem>They tap Show pairing code.</StepItem>
              <StepItem>You point this phone at their screen.</StepItem>
            </StepList>
          </Card>
          <QrScanner
            onCode={handlePairingCode}
            feedback={feedback}
            hint="Point the camera at the pairing code on your parents' phone."
          />
          <LinkButton href={ROUTES.home} variant="secondary" fullWidth>
            Back home
          </LinkButton>
        </ShareContainer>
      </Screen>
    );
  }

  const recordCount =
    state.checkIns.filter((c) => c.date >= range.from && c.date <= range.to).length +
    state.missionLogs.filter((m) => m.date >= range.from && m.date <= range.to).length;

  return (
    <Screen>
      <ShareContainer>
        <Stack gap="xs">
          <Stack gap="sm" direction="row" align="center">
            <Heading level={1}>Show your parents</Heading>
            {state.isDemo ? <Chip label="Demo data" tone="primary" /> : null}
          </Stack>
          <Text tone="muted">
            Your parents scan this code with their phone. Only your family can read it.
          </Text>
        </Stack>

        <LinkedBadge role="status">Linked with your family&apos;s phone</LinkedBadge>

        <OptionGroup legend="How many days to share" columns={3}>
          {SHARE_RANGE_DAYS.map((days) => (
            <OptionButton
              key={days}
              label={`${days} days`}
              selected={rangeDays === days}
              onSelect={() => setRangeDays(days)}
            />
          ))}
        </OptionGroup>

        <Card label="Data code">
          <Stack gap="md">
            {buildError ? <Text tone="urgent">{buildError}</Text> : null}
            {isBuilding && frames.length === 0 ? (
              <Text tone="muted">Preparing the code...</Text>
            ) : null}
            {frames.length > 0 ? <QrDisplay frames={frames} label="Data code" /> : null}
            <Text size="sm" tone="muted">
              {recordCount === 0
                ? "Nothing marked in these days yet. The code still works; it just carries no records."
                : `${recordCount} records from ${range.from} to ${range.to}.`}
            </Text>
            {frames.length > 0 ? <CopyCodeButton frames={frames} /> : null}
          </Stack>
        </Card>

        <ActionRow>
          <LinkButton href={ROUTES.home} variant="primary" fullWidth>
            Done
          </LinkButton>
          <Button variant="secondary" fullWidth onClick={() => setIsForgetOpen(true)}>
            Forget this link
          </Button>
        </ActionRow>

        <Dialog
          open={isForgetOpen}
          title="Forget this link?"
          onClose={() => setIsForgetOpen(false)}
        >
          <Stack gap="md">
            <Text>
              Your records stay on this phone. You will need to scan a new pairing code to share
              again.
            </Text>
            <Button
              variant="urgent"
              fullWidth
              onClick={() => {
                family.forgetLink();
                setIsForgetOpen(false);
              }}
            >
              Forget link
            </Button>
          </Stack>
        </Dialog>
      </ShareContainer>
    </Screen>
  );
}
