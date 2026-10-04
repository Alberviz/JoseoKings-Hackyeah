"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, LinkButton, Screen, Stack, Text, TextField } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { useAppState } from "@/hooks/useAppState";
import { useParentSession } from "@/hooks/useParentSession";
import { createPinRecord, hasPin, isValidPin } from "@/lib/pin";
import { buildDemoState } from "@/lib/demo-data";
import { ParentBanner } from "../ParentBanner/ParentBanner";
import { SectionCard } from "../SectionCard/SectionCard";
import { SECTION_BUTTON_VARIANT } from "../sections";
import { AlertBox, SetupContainer, SetupForm } from "./SetupScreen.style";

export function SetupScreen() {
  const router = useRouter();
  const { state, actions, isReady } = useAppState();
  const session = useParentSession();

  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [nicknameError, setNicknameError] = useState<string | undefined>(undefined);
  const [pinError, setPinError] = useState<string | undefined>(undefined);
  const [confirmPinError, setConfirmPinError] = useState<string | undefined>(undefined);
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
          <ParentBanner
            section="more"
            icon="lock"
            title="Parent mode already set up"
            stickers={0}
          />
          <SectionCard section="more" title="Already configured">
            <Stack gap="md">
              <Text>
                Parent mode is already set up for {state.child?.nickname}. You can open parent mode
                or manage settings.
              </Text>
              <Stack gap="sm">
                <LinkButton href={ROUTES.parent} variant={SECTION_BUTTON_VARIANT.more} fullWidth>
                  Go to parent mode
                </LinkButton>
                <LinkButton href={ROUTES.parentSettings} variant="secondary" fullWidth>
                  Manage settings
                </LinkButton>
              </Stack>
            </Stack>
          </SectionCard>
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

  const handleLoadDemo = () => {
    const demo = buildDemoState();
    actions.loadDemo(demo);
    router.replace(ROUTES.home);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    let hasValidationError = false;

    if (!nickname.trim()) {
      setNicknameError("Please enter a name.");
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
      actions.setSettings(pinRecord);

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
          <ParentBanner
            section="more"
            icon="lock"
            title="Parent mode setup"
            subtitle="Set up your child profile and a parent PIN."
            stickers={0}
          />

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
              <SectionCard section="more" title="Child profile" label="Child details">
                <Stack gap="md">
                  <TextField
                    label="Child's name"
                    value={nickname}
                    onChange={handleNicknameChange}
                    error={nicknameError}
                    hint="A familiar name. No surname, birth date or identifiers are needed."
                    maxLength={30}
                    autoComplete="off"
                  />
                </Stack>
              </SectionCard>

              <SectionCard section="more" title="Create a 4-digit PIN" label="Parent PIN setup">
                <Stack gap="md">
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
              </SectionCard>

              <Stack gap="sm">
                <Button
                  type="submit"
                  variant={SECTION_BUTTON_VARIANT.more}
                  disabled={isSubmitting || !session.isCryptoAvailable}
                  fullWidth
                >
                  Complete setup
                </Button>
                <Button type="button" variant="secondary" onClick={handleLoadDemo} fullWidth>
                  Quick Start: Load demo data & explore
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
