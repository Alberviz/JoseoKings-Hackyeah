"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  ActionRow,
  CodeTextarea,
  HiddenFileInput,
  LinkedBadge,
  ShareContainer,
  StepItem,
  StepList,
} from "./ShareScreen.style";

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

/** Child side of the family link: import pairing file or code, export encrypted sync file or code. */
export function ShareScreen() {
  const { state, actions, isReady } = useAppState();
  const family = useFamilyLink();

  const [feedback, setFeedback] = useState<Feedback | undefined>(undefined);
  const [rangeDays, setRangeDays] = useState<ShareRangeDays>(7);
  const [build, setBuild] = useState<BuildResult | null>(null);
  const [isForgetOpen, setIsForgetOpen] = useState(false);
  const [pastedPairing, setPastedPairing] = useState("");
  const [isCodeVisible, setIsCodeVisible] = useState(false);

  const pairingFileInputRef = useRef<HTMLInputElement>(null);

  const link = family.link;
  const cryptoAvailable = isLinkCryptoAvailable();

  const handlePairingText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!isPairingCode(trimmed)) {
        setFeedback({
          tone: "urgent",
          message:
            "That is not a pairing code. Ask your parents to export the pairing file from Family link.",
        });
        return;
      }
      try {
        const pairing = decodePairing(trimmed);
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
        setFeedback({
          tone: "success",
          message: "Linked! This phone is now connected with your family.",
        });
        setPastedPairing("");
      } catch (error) {
        setFeedback({ tone: "urgent", message: describeLinkError(error, "child") });
      }
    },
    [actions, family, state.child],
  );

  const handlePairingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handlePairingText(content);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

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
            error: "The sync file could not be prepared. Try a shorter range.",
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

  const syncFileContent = frames.join("\n");

  const handleDownloadSync = () => {
    if (frames.length === 0) return;
    triggerDownload(`mycrohnie-sync-${range.to}.enc`, syncFileContent);
  };

  const handleShareSync = async () => {
    if (frames.length === 0) return;
    const filename = `mycrohnie-sync-${range.to}.enc`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        const file = new File([syncFileContent], filename, { type: "text/plain" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "MyCrohnie Encrypted Sync",
            files: [file],
          });
          return;
        }
        await navigator.share({
          title: "MyCrohnie Encrypted Sync",
          text: syncFileContent,
        });
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    handleDownloadSync();
  };

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
              Connect your phone to your parents using an offline file or code. No internet, no
              accounts, and 100% private.
            </Text>
          </Stack>

          <Card label="How to link">
            <StepList>
              <StepItem>Ask your parents to open Family link on their phone.</StepItem>
              <StepItem>
                They tap &quot;Download pairing file&quot; or &quot;Share file&quot;.
              </StepItem>
              <StepItem>Select that pairing file below or paste the pairing code.</StepItem>
            </StepList>
          </Card>

          <HiddenFileInput
            ref={pairingFileInputRef}
            type="file"
            accept=".link,.txt,.json"
            onChange={handlePairingFileUpload}
            aria-label="Select pairing file"
          />

          <ActionRow>
            <Button
              variant="primary"
              fullWidth
              onClick={() => pairingFileInputRef.current?.click()}
            >
              📁 Select pairing file (.link / .txt)
            </Button>
          </ActionRow>

          <Card label="Paste code">
            <Stack gap="xs">
              <Text size="sm" tone="muted">
                Or paste the pairing code (CCP1:...) here:
              </Text>
              <CodeTextarea
                placeholder="Paste pairing code here (CCP1:...)"
                value={pastedPairing}
                onChange={(e) => setPastedPairing(e.target.value)}
                aria-label="Paste pairing code"
              />
              <Button
                variant="secondary"
                fullWidth
                disabled={!pastedPairing.trim()}
                onClick={() => handlePairingText(pastedPairing)}
              >
                Link with pasted code
              </Button>
            </Stack>
          </Card>

          {feedback ? (
            <Text tone={feedback.tone === "urgent" ? "urgent" : "default"}>{feedback.message}</Text>
          ) : null}

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
            Export your records for your parents. Only your family can read the encrypted file.
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

        <Card label="Export records">
          <Stack gap="md">
            {buildError ? <Text tone="urgent">{buildError}</Text> : null}
            {isBuilding && frames.length === 0 ? (
              <Text tone="muted">Preparing encrypted sync file...</Text>
            ) : null}
            <Text size="sm" tone="muted">
              {recordCount === 0
                ? "Nothing marked in these days yet. The file still works; it just carries no records."
                : `${recordCount} records from ${range.from} to ${range.to}.`}
            </Text>

            {frames.length > 0 ? (
              <ActionRow>
                <Button variant="primary" fullWidth onClick={handleDownloadSync}>
                  💾 Download sync file (.enc)
                </Button>
                <Button variant="secondary" fullWidth onClick={handleShareSync}>
                  📤 Share file (AirDrop / WhatsApp / Nearby)
                </Button>
                <CopyCodeButton frames={frames} />
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setIsCodeVisible((prev) => !prev)}
                >
                  {isCodeVisible ? "Hide raw code" : "View raw code"}
                </Button>
                {isCodeVisible ? (
                  <CodeTextarea readOnly value={syncFileContent} aria-label="Raw encrypted code" />
                ) : null}
              </ActionRow>
            ) : null}
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
              Your records stay on this phone. You will need to import a new pairing file to share
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
