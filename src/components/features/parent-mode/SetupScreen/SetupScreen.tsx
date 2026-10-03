"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Chip,
  Heading,
  LinkButton,
  Screen,
  Stack,
  Text,
  TextField,
} from "@/components/ui";
import { ROUTES } from "@/config/app";
import { MISSION_IDS } from "@/config/content-ids";
import { useAppState } from "@/hooks/useAppState";
import { useParentSession } from "@/hooks/useParentSession";
import { createPinRecord, hasPin, isValidPin } from "@/lib/pin";
import { formatMissionTitle } from "../missionLabels";
import { AlertBox, ChipWrap, ErrorText, SetupContainer, SetupForm } from "./SetupScreen.style";

const ALL_MISSIONS = Object.values(MISSION_IDS);

export function SetupScreen() {
  const router = useRouter();
  const { state, actions, isReady } = useAppState();
  const session = useParentSession();

  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [enabledMissions, setEnabledMissions] = useState<string[]>(ALL_MISSIONS);

  const [nicknameError, setNicknameError] = useState<string | undefined>(undefined);
  const [pinError, setPinError] = useState<string | undefined>(undefined);
  const [confirmPinError, setConfirmPinError] = useState<string | undefined>(undefined);
  const [missionsError, setMissionsError] = useState<string | undefined>(undefined);
  const [generalError, setGeneralError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isReady) {
    return (
      <Screen>
        <SetupContainer>
          <Text tone="muted">Loading setup...</Text>
        </SetupContainer>
      </Screen>
    );
  }

  // If a child and a PIN already exist, do not let the screen overwrite them silently.
  const hasExistingSetup = Boolean(state.child && hasPin(state.settings));
  if (hasExistingSetup) {
    return (
      <Screen>
        <SetupContainer>
          <Card label="Already configured">
            <Stack gap="md">
              <Heading level={1}>Parent mode already set up</Heading>
              <Text>
                Parent mode is already set up for {state.child?.nickname}. You can open parent mode
                or manage settings.
              </Text>
              <Stack gap="sm">
                <LinkButton href={ROUTES.parent} variant="primary" fullWidth>
                  Go to parent mode
                </LinkButton>
                <LinkButton href={ROUTES.parentSettings} variant="secondary" fullWidth>
                  Manage settings
                </LinkButton>
              </Stack>
            </Stack>
          </Card>
        </SetupContainer>
      </Screen>
    );
  }

  const handleNicknameChange = (val: string) => {
    setNickname(val);
    if (nicknameError) setNicknameError(undefined);
  };

  const handlePinChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 4);
    setPin(digitsOnly);
    if (pinError) setPinError(undefined);
  };

  const handleConfirmPinChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 4);
    setConfirmPin(digitsOnly);
    if (confirmPinError) setConfirmPinError(undefined);
  };

  const toggleMission = (id: string) => {
    setEnabledMissions((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      if (next.length > 0 && missionsError) {
        setMissionsError(undefined);
      }
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    let hasValidationError = false;

    if (!nickname.trim()) {
      setNicknameError("Please enter a nickname.");
      hasValidationError = true;
    }

    if (!isValidPin(pin)) {
      setPinError("The PIN must be 4 digits.");
      hasValidationError = true;
    }

    if (pin !== confirmPin) {
      setConfirmPinError("PINs do not match.");
      hasValidationError = true;
    }

    if (enabledMissions.length === 0) {
      setMissionsError("Choose at least one mission.");
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    if (!session.isCryptoAvailable) {
      setGeneralError(
        "PIN creation requires a secure connection (HTTPS or localhost). Please open this app over HTTPS.",
      );
      return;
    }

    setIsSubmitting(true);
    setGeneralError(undefined);

    try {
      const pinRecord = await createPinRecord(pin);
      actions.setChild({ nickname: nickname.trim() });
      actions.setSettings({
        ...pinRecord,
        allowedMissionIds: enabledMissions,
      });

      session.setUnlocked(true);
      router.push(ROUTES.parent);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "Failed to create PIN.");
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <SetupContainer>
        <Stack gap="lg">
          <Stack gap="xs">
            <Heading level={1}>Parent mode setup</Heading>
            <Text tone="muted">
              Set up your child profile, parent PIN, and choose which movement missions are
              available.
            </Text>
          </Stack>

          {!session.isCryptoAvailable ? (
            <AlertBox $variant="urgent" role="alert">
              Creating a PIN requires a secure connection (HTTPS or localhost).
            </AlertBox>
          ) : null}

          {generalError ? (
            <AlertBox $variant="urgent" role="alert">
              {generalError}
            </AlertBox>
          ) : null}

          <SetupForm onSubmit={handleSubmit}>
            <Stack gap="lg">
              <Card label="Child details">
                <Stack gap="md">
                  <Heading level={2}>Child profile</Heading>
                  <TextField
                    label="Child's nickname"
                    value={nickname}
                    onChange={handleNicknameChange}
                    error={nicknameError}
                    hint="A familiar name. No surname, birth date or identifiers are needed."
                    maxLength={30}
                    autoComplete="off"
                  />
                </Stack>
              </Card>

              <Card label="Parent PIN setup">
                <Stack gap="md">
                  <Heading level={2}>Create a 4-digit PIN</Heading>
                  <Text size="sm" tone="muted">
                    This PIN separates parent mode from child mode on this device.
                  </Text>
                  <TextField
                    label="Create 4-digit PIN"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={handlePinChange}
                    error={pinError}
                    autoComplete="off"
                  />
                  <TextField
                    label="Confirm 4-digit PIN"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={handleConfirmPinChange}
                    error={confirmPinError}
                    autoComplete="off"
                  />
                </Stack>
              </Card>

              <Card label="Enabled missions">
                <Stack gap="md">
                  <Heading level={2}>Enabled missions</Heading>
                  <Text size="sm" tone="muted">
                    Choose which gentle movement missions your child can pick from. You can change
                    this anytime in settings.
                  </Text>
                  <ChipWrap>
                    {ALL_MISSIONS.map((missionId) => (
                      <Chip
                        key={missionId}
                        label={formatMissionTitle(missionId)}
                        selected={enabledMissions.includes(missionId)}
                        onToggle={() => toggleMission(missionId)}
                      />
                    ))}
                  </ChipWrap>
                  {missionsError ? <ErrorText role="alert">{missionsError}</ErrorText> : null}
                </Stack>
              </Card>

              <Stack gap="sm">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || !session.isCryptoAvailable}
                  fullWidth
                >
                  Complete setup
                </Button>
                {/* No "Back to child mode" here: before the setup there is no child, so "/" would send the family right back to this screen. */}
              </Stack>
            </Stack>
          </SetupForm>
        </Stack>
      </SetupContainer>
    </Screen>
  );
}
