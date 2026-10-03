"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, Chip, Heading, Stack, Text, TextField } from "@/components/ui";
import {
  hasPin,
  isLocked,
  NO_ATTEMPTS,
  registerFailure,
  registerSuccess,
  remainingLockMs,
  verifyPin,
  type PinAttempts,
} from "@/lib/pin";
import type {
  MissionCompany,
  MissionConfirmation as ConfirmationKind,
  ParentSettings,
} from "@/types";
import {
  AlertBox,
  ConfirmationActionBox,
  ConfirmationContainer,
  PinForm,
} from "./MissionConfirmation.style";

type MissionConfirmationProps = {
  company: MissionCompany;
  parentSettings: ParentSettings | null;
  isDemo?: boolean;
  onConfirm: (how: ConfirmationKind) => void;
  onStop: () => void;
};

export function MissionConfirmation({
  company,
  parentSettings,
  isDemo = false,
  onConfirm,
  onStop,
}: MissionConfirmationProps) {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | undefined>(undefined);
  const [attempts, setAttempts] = useState<PinAttempts>(NO_ATTEMPTS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setTick] = useState(0);

  const isCryptoAvailable =
    typeof window !== "undefined" &&
    typeof window.crypto !== "undefined" &&
    Boolean(window.crypto.subtle);

  const currentNow = Date.now();
  const lockedOut = isLocked(attempts, currentNow);
  const remainingSeconds = Math.ceil(remainingLockMs(attempts, currentNow) / 1000);
  const pinConfigured = hasPin(parentSettings);

  // Update lockout countdown every second while locked
  useEffect(() => {
    if (!lockedOut) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedOut]);

  const handlePinSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (pin.length !== 4 || isSubmitting || lockedOut || !isCryptoAvailable) {
      return;
    }

    setIsSubmitting(true);
    setPinError(undefined);

    try {
      const isValid = await verifyPin(pin, parentSettings);
      if (isValid) {
        setAttempts(registerSuccess());
        onConfirm("parent-pin");
      } else {
        setAttempts((prev) => registerFailure(prev, Date.now()));
        setPinError("Incorrect PIN. Please try again.");
        setPin("");
      }
    } catch {
      setPinError("Could not verify PIN. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
    setPin(digitsOnly);
    if (pinError) {
      setPinError(undefined);
    }
  };

  return (
    <ConfirmationContainer>
      {company === "alone" ? (
        <Stack gap="lg">
          <Stack gap="xs" align="center">
            <Heading level={2}>All done!</Heading>
            <Text tone="muted">
              You finished all the steps of this routine. Tap below to confirm.
            </Text>
          </Stack>

          <ConfirmationActionBox>
            <Button variant="primary" onClick={() => onConfirm("child")} fullWidth>
              I did it
            </Button>
            <Button variant="secondary" onClick={onStop} fullWidth>
              Stop
            </Button>
          </ConfirmationActionBox>
        </Stack>
      ) : null}

      {company === "other" ? (
        <Stack gap="lg">
          <Stack gap="xs" align="center">
            <Heading level={2}>Great teamwork!</Heading>
            <Text tone="muted">You both did it together! Ask your partner to tap Confirm.</Text>
          </Stack>

          <ConfirmationActionBox>
            <Button variant="primary" onClick={() => onConfirm("other-tap")} fullWidth>
              Confirm
            </Button>
            <Button variant="secondary" onClick={onStop} fullWidth>
              Stop
            </Button>
          </ConfirmationActionBox>
        </Stack>
      ) : null}

      {company === "family" ? (
        <Stack gap="lg">
          <Stack gap="xs" align="center">
            <Heading level={2}>Done with family!</Heading>
            <Text tone="muted">
              You both did it together! Ask a parent or carer to enter their 4-digit PIN.
            </Text>
          </Stack>

          {isDemo ? (
            <Card label="Demo mode indicator">
              <Stack gap="xs" direction="row" align="center">
                <Chip label="Demo data" tone="primary" />
                <Text size="sm">Demo PIN: 1234</Text>
              </Stack>
            </Card>
          ) : null}

          {!isCryptoAvailable ? (
            <AlertBox $variant="urgent" role="alert">
              PIN entry requires a secure connection (HTTPS or localhost). Please open this app over
              HTTPS.
            </AlertBox>
          ) : null}

          {!pinConfigured ? (
            <Card label="No PIN set">
              <Stack gap="sm">
                <Text>No parent PIN has been configured yet.</Text>
                <Button variant="primary" onClick={() => onConfirm("parent-pin")} fullWidth>
                  Confirm with parent
                </Button>
                <Button variant="secondary" onClick={onStop} fullWidth>
                  Stop
                </Button>
              </Stack>
            </Card>
          ) : (
            <PinForm onSubmit={handlePinSubmit}>
              {lockedOut ? (
                <AlertBox $variant="urgent" role="alert">
                  Too many failed attempts. Locked for {remainingSeconds} seconds.
                </AlertBox>
              ) : null}

              <TextField
                label="Parent 4-digit PIN"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={handlePinChange}
                error={pinError}
                disabled={lockedOut || isSubmitting || !isCryptoAvailable}
                autoComplete="off"
              />

              <ConfirmationActionBox>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={pin.length !== 4 || lockedOut || isSubmitting || !isCryptoAvailable}
                  fullWidth
                >
                  Confirm PIN
                </Button>
                <Button variant="secondary" onClick={onStop} fullWidth>
                  Stop
                </Button>
              </ConfirmationActionBox>
            </PinForm>
          )}
        </Stack>
      ) : null}
    </ConfirmationContainer>
  );
}
