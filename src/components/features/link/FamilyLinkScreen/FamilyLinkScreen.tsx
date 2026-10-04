"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Chip,
  Dialog,
  Heading,
  LinkButton,
  Screen,
  Stack,
  Text,
} from "@/components/ui";
import { ROUTES } from "@/config/app";
import { useAppState } from "@/hooks/useAppState";
import { useFamilyLink } from "@/hooks/useFamilyLink";
import { useParentSession } from "@/hooks/useParentSession";
import {
  decodeShare,
  encodePairing,
  generateFamilyId,
  generateFamilyKey,
  isLinkCryptoAvailable,
  LINK_VERSION,
  mergeShare,
  type MergeSummary,
} from "@/lib/link";
import { hasPin } from "@/lib/pin";
import { PinGate } from "@/components/features/parent-mode/PinGate/PinGate";
import { CopyCodeButton } from "../CopyCodeButton/CopyCodeButton";
import { describeLinkError } from "../linkMessages";
import {
  ActionRow,
  CodeTextarea,
  FactLine,
  FamilyLinkContainer,
  HiddenFileInput,
  KeyWarning,
  SummaryList,
  SummaryTerm,
  SummaryValue,
} from "./FamilyLinkScreen.style";

type Feedback = {
  tone: "default" | "urgent" | "success";
  message: string;
};

function triggerDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Parent side of the family link: create the key, export pairing file, import encrypted data files. */
export function FamilyLinkScreen() {
  const { state, actions, isReady } = useAppState();
  const session = useParentSession();
  const family = useFamilyLink();

  const [isPairingDetailsOpen, setIsPairingDetailsOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | undefined>(undefined);
  const [pastedData, setPastedData] = useState("");
  const [lastSummary, setLastSummary] = useState<MergeSummary | null>(null);
  const [isForgetOpen, setIsForgetOpen] = useState(false);
  const isDecoding = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setFeedback({
      tone: "success",
      message: "Family link created! Share the pairing file with your child.",
    });
  };

  const processImportText = useCallback(
    (rawText: string) => {
      if (!link || isDecoding.current) {
        return;
      }
      const lines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        setFeedback({ tone: "urgent", message: "The imported content is empty." });
        return;
      }

      isDecoding.current = true;
      setFeedback({ tone: "default", message: "Reading and decrypting data..." });

      decodeShare(lines, link.keyB64, link.familyId)
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
          setFeedback({ tone: "success", message: "Records successfully decrypted and merged!" });
          setPastedData("");
        })
        .catch((error: unknown) => {
          setFeedback({ tone: "urgent", message: describeLinkError(error, "parent") });
        })
        .finally(() => {
          isDecoding.current = false;
        });
    },
    [actions, family, link, state],
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        processImportText(content);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDownloadPairing = () => {
    if (pairingFrames.length === 0) return;
    triggerDownload("mycrohnie-family-pairing.link", pairingFrames[0]);
  };

  const handleSharePairing = async () => {
    if (pairingFrames.length === 0) return;
    const content = pairingFrames[0];
    const filename = "mycrohnie-family-pairing.link";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        const file = new File([content], filename, { type: "text/plain" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "MyCrohnie Family Link Pairing",
            files: [file],
          });
          return;
        }
        await navigator.share({
          title: "MyCrohnie Family Link Pairing",
          text: content,
        });
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    handleDownloadPairing();
  };

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
        <Stack gap="xs">
          <Stack gap="sm" direction="row" align="center">
            <Heading level={1}>Family link</Heading>
            {state.isDemo ? <Chip label="Demo data" tone="primary" /> : null}
          </Stack>
          <Text tone="muted">
            Connect {childName}&apos;s phone to this one using an offline file or code. No internet,
            no account, 100% private and encrypted.
          </Text>
        </Stack>

        <LinkButton href={ROUTES.parent} variant="secondary">
          ← Back to parent summary
        </LinkButton>

        {!cryptoAvailable ? (
          <Text tone="urgent">
            The family link needs a secure connection (HTTPS or localhost). Open the app from its
            installed icon or its https address.
          </Text>
        ) : null}

        {!link && cryptoAvailable ? (
          <Card label="Create the family link">
            <Stack gap="md">
              <Heading level={2}>Create the family link</Heading>
              <Text size="sm">
                This creates a secret key that lives only on your two phones. The key travels once,
                in a pairing file or code you send to {childName}&apos;s phone. Every sync file
                after that can be read only with it.
              </Text>
              <Button variant="primary" fullWidth onClick={createLink}>
                Create family link
              </Button>
            </Stack>
          </Card>
        ) : null}

        {link && cryptoAvailable ? (
          <>
            <Card label="Pairing file & code">
              <Stack gap="md">
                <Heading level={2}>Pairing file & code</Heading>
                <FactLine>
                  Linked since {link.linkedAt.slice(0, 10)}
                  {link.lastExchangeAt
                    ? `. Last sync received ${link.lastExchangeAt.slice(0, 10)}.`
                    : ". No sync received yet."}
                </FactLine>
                <KeyWarning role="note">
                  Send this pairing file or code only to {childName}&apos;s phone. It carries the
                  family encryption key. It does not contain any health data.
                </KeyWarning>

                <ActionRow>
                  <Button variant="primary" fullWidth onClick={handleDownloadPairing}>
                    💾 Download pairing file (.link)
                  </Button>
                  <Button variant="secondary" fullWidth onClick={handleSharePairing}>
                    📤 Share file (AirDrop / WhatsApp / Nearby)
                  </Button>
                  {pairingFrames.length > 0 ? <CopyCodeButton frames={pairingFrames} /> : null}
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setIsPairingDetailsOpen((prev) => !prev)}
                  >
                    {isPairingDetailsOpen ? "Hide raw code" : "View raw code"}
                  </Button>
                </ActionRow>

                {isPairingDetailsOpen && pairingFrames.length > 0 ? (
                  <CodeTextarea readOnly value={pairingFrames[0]} aria-label="Raw pairing code" />
                ) : null}
              </Stack>
            </Card>

            <Card label="Receive records from child">
              <Stack gap="md">
                <Heading level={2}>Receive from {childName}</Heading>
                <Text size="sm">
                  On {childName}&apos;s phone, open Show your parents and download or share their
                  sync file (.enc). Select that file here or paste the code below.
                </Text>

                <HiddenFileInput
                  ref={fileInputRef}
                  type="file"
                  accept=".enc,.txt,.link,.json"
                  onChange={handleFileUpload}
                  aria-label="Upload sync file"
                />

                <Button variant="primary" fullWidth onClick={() => fileInputRef.current?.click()}>
                  📁 Upload sync file (.enc / .txt)
                </Button>

                <Stack gap="xs">
                  <Text size="sm" tone="muted">
                    Or paste the encrypted code from the child&apos;s phone:
                  </Text>
                  <CodeTextarea
                    placeholder="Paste encrypted code here (CCD1:...)"
                    value={pastedData}
                    onChange={(e) => setPastedData(e.target.value)}
                    aria-label="Paste encrypted code"
                  />
                  <Button
                    variant="secondary"
                    fullWidth
                    disabled={!pastedData.trim()}
                    onClick={() => processImportText(pastedData)}
                  >
                    Import pasted code
                  </Button>
                </Stack>

                {feedback ? (
                  <Text tone={feedback.tone === "urgent" ? "urgent" : "default"}>
                    {feedback.message}
                  </Text>
                ) : null}
              </Stack>
            </Card>

            <Button variant="secondary" fullWidth onClick={() => setIsForgetOpen(true)}>
              Forget this link
            </Button>
          </>
        ) : null}

        <Stack gap="sm">
          <Button variant="secondary" onClick={session.lock} fullWidth>
            Lock
          </Button>
          <LinkButton href={ROUTES.parent} variant="secondary" fullWidth>
            Back to parent summary
          </LinkButton>
        </Stack>

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
              <Button variant="primary" fullWidth onClick={() => setLastSummary(null)}>
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
                setIsPairingDetailsOpen(false);
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
