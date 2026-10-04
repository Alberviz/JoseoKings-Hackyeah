"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Chip, LinkButton, Stack, Text, TextField } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { useAppState } from "@/hooks/useAppState";
import { useParentSession } from "@/hooks/useParentSession";
import { authenticateBiometric, isBiometricAvailable, isBiometricEnrolled } from "@/lib/biometrics";
import { hasPin } from "@/lib/pin";
import { ParentBanner } from "../ParentBanner/ParentBanner";
import { SectionCard } from "../SectionCard/SectionCard";
import { SECTION_BUTTON_VARIANT } from "../sections";
import { AlertBox, GateContainer, GateForm } from "./PinGate.style";

type PinGateProps = {
  title?: string;
  description?: string;
  onSuccess?: () => void;
};

export function PinGate({
  title = "Parent mode",
  description = "Enter your 4-digit PIN to access parent mode.",
  onSuccess,
}: PinGateProps) {
  const { state } = useAppState();
  const session = useParentSession();

  const [pin, setPin] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [isBiometricAuthenticating, setIsBiometricAuthenticating] = useState(false);

  useEffect(() => {
    let mounted = true;
    void isBiometricAvailable().then((avail) => {
      if (mounted) {
        setBiometricAvailable(avail);
        setBiometricEnrolled(isBiometricEnrolled());
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const isConfigured = hasPin(state.settings);

  const handleBiometricUnlock = async () => {
    if (isBiometricAuthenticating || session.isLockedOut) return;

    setIsBiometricAuthenticating(true);
    setErrorMessage(undefined);

    try {
      const result = await authenticateBiometric();
      if (result.success) {
        session.setUnlocked(true);
        onSuccess?.();
      } else if (result.error && !result.error.toLowerCase().includes("cancelled")) {
        setErrorMessage(result.error);
      }
    } finally {
      setIsBiometricAuthenticating(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (pin.length !== 4 || isSubmitting || session.isLockedOut) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      const result = await session.unlock(pin, state.settings);
      if (!result.success) {
        setErrorMessage(result.error ?? "Incorrect PIN. Please try again.");
        setPin("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinChange = (nextValue: string) => {
    // Only allow digits up to 4 characters
    const digitsOnly = nextValue.replace(/\D/g, "").slice(0, 4);
    setPin(digitsOnly);
    if (errorMessage) {
      setErrorMessage(undefined);
    }
  };

  return (
    <GateContainer>
      <Stack gap="lg">
        <ParentBanner
          section="more"
          icon="lock"
          title={title}
          subtitle={description}
          stickers={0}
        />

        {state.isDemo ? (
          <AlertBox $variant="info" aria-label="Demo mode indicator">
            <Stack gap="xs" direction="row" align="center">
              <Chip label="Demo data" tone="primary" />
              <Text size="sm">Demo PIN: 1234</Text>
            </Stack>
          </AlertBox>
        ) : null}

        {!session.isCryptoAvailable ? (
          <AlertBox $variant="urgent" role="alert">
            PIN entry requires a secure connection (HTTPS or localhost). Please open this app over
            HTTPS.
          </AlertBox>
        ) : null}

        {!isConfigured ? (
          <SectionCard section="more" title="Setup required">
            <Stack gap="md">
              <Text>No PIN has been created yet.</Text>
              <LinkButton href={ROUTES.parentSetup} variant={SECTION_BUTTON_VARIANT.more}>
                Set up parent PIN
              </LinkButton>
            </Stack>
          </SectionCard>
        ) : (
          <GateForm onSubmit={handleSubmit}>
            {session.isLockedOut ? (
              <AlertBox $variant="urgent" role="alert">
                Too many failed attempts. Locked for {session.remainingLockSeconds} seconds.
              </AlertBox>
            ) : null}

            {biometricAvailable && biometricEnrolled ? (
              <Stack gap="xs" align="center">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBiometricUnlock}
                  disabled={
                    session.isLockedOut || isBiometricAuthenticating || !session.isCryptoAvailable
                  }
                  fullWidth
                >
                  {isBiometricAuthenticating ? "Verifying..." : "Unlock with Face ID / Fingerprint"}
                </Button>
                <Text size="sm" tone="muted">
                  or enter 4-digit PIN
                </Text>
              </Stack>
            ) : null}

            <TextField
              label="4-digit PIN"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={handlePinChange}
              error={errorMessage}
              disabled={session.isLockedOut || isSubmitting || !session.isCryptoAvailable}
              autoComplete="off"
            />

            <Stack gap="sm">
              <Button
                type="submit"
                variant={SECTION_BUTTON_VARIANT.more}
                disabled={
                  pin.length !== 4 ||
                  session.isLockedOut ||
                  isSubmitting ||
                  !session.isCryptoAvailable
                }
                fullWidth
              >
                Unlock
              </Button>
              <LinkButton href={ROUTES.home} variant="secondary" fullWidth>
                Back to child mode
              </LinkButton>
            </Stack>
          </GateForm>
        )}
      </Stack>
    </GateContainer>
  );
}
