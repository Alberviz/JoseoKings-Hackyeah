"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Button, Chip, Dialog, Screen, Stack, Text } from "@/components/ui";
import { useAppState } from "@/hooks/useAppState";
import { useFamilyLink } from "@/hooks/useFamilyLink";
import { useParentSession } from "@/hooks/useParentSession";
import {
  decodeShare,
  encodePairing,
  FrameCollector,
  generateFamilyId,
  generateFamilyKey,
  isLinkCryptoAvailable,
  isShareFrame,
  LINK_VERSION,
  mergeShare,
  type MergeSummary,
} from "@/lib/link";
import { hasPin } from "@/lib/pin";
import { PinGate } from "@/components/features/parent-mode/PinGate/PinGate";
import { ParentBanner } from "@/components/features/parent-mode/ParentBanner/ParentBanner";
import { SectionCard } from "@/components/features/parent-mode/SectionCard/SectionCard";
import { SECTION_BUTTON_VARIANT } from "@/components/features/parent-mode/sections";
import { CopyCodeButton } from "../CopyCodeButton/CopyCodeButton";
import { describeLinkError } from "../linkMessages";
import { QrDisplay } from "../QrDisplay/QrDisplay";
import { QrScanner, type ScanFeedback } from "../QrScanner/QrScanner";
import {
  FactLine,
  FamilyLinkContainer,
  KeyWarning,
  SubtitleRow,
  SummaryList,
  SummaryTerm,
  SummaryValue,
} from "./FamilyLinkScreen.style";

/** Parent side of the family link: create the key, show the pairing code, receive data codes. */
export function FamilyLinkScreen() {
  const { state, actions, isReady } = useAppState();
  const session = useParentSession();
  const family = useFamilyLink();

  const [isPairingVisible, setIsPairingVisible] = useState(false);
  const [feedback, setFeedback] = useState<ScanFeedback | undefined>(undefined);
  const [lastSummary, setLastSummary] = useState<MergeSummary | null>(null);
  const [isForgetOpen, setIsForgetOpen] = useState(false);
  const collector = useRef(new FrameCollector());
  const isDecoding = useRef(false);

  const link = family.link;
  const hasConfiguredPin = hasPin(state.settings);
  const cryptoAvailable = isLinkCryptoAvailable();
  const childName = state.child?.nickname ?? "your child";

  const pairingFrames = useMemo(() => {
    if (!link || !state.child) {
      return [];
    }
    return [
      encodePairing({
        v: LINK_VERSION,
        familyId: link.familyId,
        keyB64: link.keyB64,
        nickname: state.child.nickname,
        allowedMissionIds: state.settings?.allowedMissionIds ?? [],
        specialRewards: state.economy.specialRewards.map((reward) => ({
          id: reward.id,
          name: reward.name,
          fireCost: reward.fireCost,
        })),
        createdAt: new Date().toISOString(),
      }),
    ];
    // The code only changes when the link, the child, missions or rewards change.
  }, [link, state.child, state.settings?.allowedMissionIds, state.economy.specialRewards]);

  const createLink = () => {
    if (!state.child) {
      return;
    }
    family.setLink({
      role: "parent",
      familyId: generateFamilyId(),
      keyB64: generateFamilyKey(),
      nickname: state.child.nickname,
      allowedMissionIds: state.settings?.allowedMissionIds ?? [],
      specialRewards: state.economy.specialRewards.map((reward) => ({
        id: reward.id,
        name: reward.name,
        fireCost: reward.fireCost,
      })),
      linkedAt: new Date().toISOString(),
    });
    setIsPairingVisible(true);
  };

  const handleDataCode = useCallback(
    (text: string) => {
      if (!link || isDecoding.current) {
        return;
      }
      if (!isShareFrame(text)) {
        setFeedback({ tone: "urgent", message: "That is not a data code from the child's phone." });
        return;
      }
      let progress: { have: number; total: number; isComplete: boolean };
      try {
        progress = collector.current.add(text);
      } catch (error) {
        setFeedback({ tone: "urgent", message: describeLinkError(error, "parent") });
        return;
      }
      if (!progress.isComplete) {
        setFeedback({
          tone: "default",
          message: `Part ${progress.have} of ${progress.total} received. Keep scanning.`,
        });
        return;
      }
      isDecoding.current = true;
      setFeedback({ tone: "default", message: "All parts received. Reading..." });
      decodeShare(collector.current.frames(), link.keyB64, link.familyId)
        .then((payload) => {
          const target = {
            checkIns: state.checkIns,
            missionLogs: state.missionLogs,
            rewardClaims: state.economy.rewardClaims,
          };
          const { state: merged, summary } = mergeShare(target, payload);
          actions.importState({
            ...state,
            checkIns: merged.checkIns,
            missionLogs: merged.missionLogs,
            economy: {
              ...state.economy,
              rewardClaims: merged.rewardClaims,
            },
          });
          family.updateLink((prev) => ({
            ...prev,
            lastExchangeAt: new Date().toISOString(),
          }));
          setLastSummary(summary);
          setFeedback({ tone: "success", message: "Received. Thank you." });
        })
        .catch((error: unknown) => {
          setFeedback({ tone: "urgent", message: describeLinkError(error, "parent") });
        })
        .finally(() => {
          collector.current.reset();
          isDecoding.current = false;
        });
    },
    [actions, family, link, state],
  );

  if (!isReady || !family.isReady) {
    return (
      <Screen>
        <FamilyLinkContainer>
          <Text tone="muted">Loading family link...</Text>
        </FamilyLinkContainer>
      </Screen>
    );
  }

  if (!state.child || !hasConfiguredPin) {
    return (
      <Screen>
        <FamilyLinkContainer>
          <PinGate
            title="Setup needed"
            description="Parent mode requires a child profile and a 4-digit PIN."
          />
        </FamilyLinkContainer>
      </Screen>
    );
  }

  if (!session.isUnlocked) {
    return (
      <Screen>
        <FamilyLinkContainer>
          <PinGate
            title="Family link"
            description="Enter your 4-digit PIN to manage the link with your child's phone."
          />
        </FamilyLinkContainer>
      </Screen>
    );
  }

  return (
    <Screen>
      <FamilyLinkContainer>
        <ParentBanner
          section="more"
          icon="link"
          title="Family link"
          subtitle={
            <SubtitleRow>
              Pair the two phones
              {state.isDemo ? <Chip label="Demo data" tone="primary" /> : null}
            </SubtitleRow>
          }
        />

        <Text tone="muted">
          Connect {childName}&apos;s phone to this one with a code shown on screen. No internet, no
          account, nothing leaves your phones.
        </Text>

        {!cryptoAvailable ? (
          <Text tone="urgent">
            The family link needs a secure connection (HTTPS or localhost). Open the app from its
            installed icon or its https address.
          </Text>
        ) : null}

        {!link && cryptoAvailable ? (
          <SectionCard section="more" title="Create the family link">
            <Stack gap="md">
              <Text size="sm">
                This creates a secret key that lives only on your two phones. The key travels once,
                in a pairing code you show to {childName}&apos;s phone. Every data code after that
                can be read only with it.
              </Text>
              <Button variant={SECTION_BUTTON_VARIANT.more} fullWidth onClick={createLink}>
                Create family link
              </Button>
            </Stack>
          </SectionCard>
        ) : null}

        {link && cryptoAvailable ? (
          <>
            <SectionCard section="more" title="Pairing code">
              <Stack gap="md">
                <FactLine>
                  Linked since {link.linkedAt.slice(0, 10)}
                  {link.lastExchangeAt
                    ? `. Last data code received ${link.lastExchangeAt.slice(0, 10)}.`
                    : ". No data code received yet."}
                </FactLine>
                <KeyWarning role="note">
                  Show this code only to {childName}&apos;s phone. It carries the family key. It
                  does not carry any health record.
                </KeyWarning>
                <Button
                  variant={isPairingVisible ? "secondary" : SECTION_BUTTON_VARIANT.more}
                  fullWidth
                  aria-expanded={isPairingVisible}
                  onClick={() => setIsPairingVisible((value) => !value)}
                >
                  {isPairingVisible ? "Hide pairing code" : "Show pairing code"}
                </Button>
                {isPairingVisible && pairingFrames.length > 0 ? (
                  <>
                    <QrDisplay frames={pairingFrames} label="Pairing code" />
                    <CopyCodeButton frames={pairingFrames} />
                  </>
                ) : null}
              </Stack>
            </SectionCard>

            <SectionCard
              section="more"
              title={`Receive from ${childName}`}
              label="Receive from the child's phone"
            >
              <Stack gap="md">
                <Text size="sm">
                  On {childName}&apos;s phone, open Show your parents. Scan the code it shows; if it
                  has several parts, keep the camera on until all parts are in.
                </Text>
                <QrScanner
                  onCode={handleDataCode}
                  feedback={feedback}
                  hint={`Point the camera at the data code on ${childName}'s phone.`}
                />
              </Stack>
            </SectionCard>

            <Button variant="secondary" fullWidth onClick={() => setIsForgetOpen(true)}>
              Forget this link
            </Button>
          </>
        ) : null}

        <Dialog
          open={lastSummary !== null}
          title="Received from the child's phone"
          onClose={() => setLastSummary(null)}
        >
          {lastSummary ? (
            <Stack gap="md">
              <SummaryList>
                <SummaryTerm>Check-ins added</SummaryTerm>
                <SummaryValue>{lastSummary.checkInsAdded}</SummaryValue>
                <SummaryTerm>Check-ins updated</SummaryTerm>
                <SummaryValue>{lastSummary.checkInsReplaced}</SummaryValue>
                <SummaryTerm>Missions added</SummaryTerm>
                <SummaryValue>{lastSummary.missionLogsAdded}</SummaryValue>
                <SummaryTerm>Reward requests added</SummaryTerm>
                <SummaryValue>{lastSummary.rewardClaimsAdded}</SummaryValue>
              </SummaryList>
              <Text size="sm" tone="muted">
                Records already on this phone were kept. Nothing was deleted.
              </Text>
              <Button
                variant={SECTION_BUTTON_VARIANT.more}
                fullWidth
                onClick={() => setLastSummary(null)}
              >
                Close
              </Button>
            </Stack>
          ) : null}
        </Dialog>

        <Dialog
          open={isForgetOpen}
          title="Forget this link?"
          onClose={() => setIsForgetOpen(false)}
        >
          <Stack gap="md">
            <Text>
              The records already received stay on this phone. {childName}&apos;s phone will need a
              new pairing code to share again.
            </Text>
            <Button
              variant="urgent"
              fullWidth
              onClick={() => {
                family.forgetLink();
                setIsPairingVisible(false);
                setIsForgetOpen(false);
              }}
            >
              Forget link
            </Button>
          </Stack>
        </Dialog>
      </FamilyLinkContainer>
    </Screen>
  );
}
