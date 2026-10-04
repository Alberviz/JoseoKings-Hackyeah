"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Chip, Heading, LinkButton, Stack, Text, TextField } from "@/components/ui";
import { ROUTES } from "@/config/app";
import { useAppState } from "@/hooks/useAppState";
import { useParentSession } from "@/hooks/useParentSession";
import { hasPin } from "@/lib/pin";
import { AlertBox, GateContainer, GateForm } from "./PinGate.style";

type PinGateProps = {
  title?: string;
  description?: string;
  onSuccess?: () => void;
};

export function PinGate({
  title = "Parent mode",
  description = "Enter your 4-digit PIN to access parent mode.",
}: PinGateProps) {
  const { state } = useAppState();
  const session = useParentSession();

  const [pin, setPin] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isConfigured = hasPin(state.settings);

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
        <Stack gap="xs">
          <Heading level={1}>{title}</Heading>
          <Text tone="muted">{description}</Text>
        </Stack>

        {state.isDemo ? (
          <Card label="Demo mode indicator">
            <Stack gap="xs" direction="row" align="center">
              <Chip label="Demo data" tone="primary" />
              <Text size="sm">Demo PIN: 1234</Text>
            </Stack>
          </Card>
        ) : null}

        {!session.isCryptoAvailable ? (
          <AlertBox $variant="urgent" role="alert">
            PIN entry requires a secure connection (HTTPS or localhost). Please open this app over
            HTTPS.
          </AlertBox>
        ) : null}

        {!isConfigured ? (
          <Card label="Setup required">
            <Stack gap="md">
              <Text>No PIN has been created yet.</Text>
              <LinkButton href={ROUTES.parentSetup} variant="primary">
                Set up parent PIN
              </LinkButton>
            </Stack>
          </Card>
        ) : (
          <GateForm onSubmit={handleSubmit}>
            {session.isLockedOut ? (
              <AlertBox $variant="urgent" role="alert">
                Too many failed attempts. Locked for {session.remainingLockSeconds} seconds.
              </AlertBox>
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
                variant="primary"
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
              {state.settings?.deviceRole !== "parent" ? (
                <LinkButton href={ROUTES.home} variant="secondary" fullWidth>
                  Back to child mode
                </LinkButton>
              ) : null}
            </Stack>
          </GateForm>
        )}
      </Stack>
    </GateContainer>
  );
}
