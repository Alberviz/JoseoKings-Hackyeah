"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
  TextField,
} from "@/components/ui";
import { ROUTES } from "@/config/app";
import { MISSION_IDS } from "@/config/content-ids";
import { useAppState } from "@/hooks/useAppState";
import { useParentSession } from "@/hooks/useParentSession";
import { buildDemoState } from "@/lib/demo-data";
import { createPinRecord, isValidPin, verifyPin } from "@/lib/pin";
import { exportBackup, importBackup } from "@/lib/storage";
import { PinGate } from "../PinGate/PinGate";
import { AlertBox, HiddenFileInput, SettingsContainer, StyledForm } from "./SettingsScreen.style";

const ALL_MISSIONS = Object.values(MISSION_IDS);

export function SettingsScreen() {
  const router = useRouter();
  const { state, actions, isReady } = useAppState();
  const session = useParentSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change PIN state
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [pinError, setPinError] = useState<string | undefined>(undefined);
  const [pinSuccess, setPinSuccess] = useState<string | undefined>(undefined);
  const [isChangingPin, setIsChangingPin] = useState(false);

  // Backup import/export state
  const [importError, setImportError] = useState<string | undefined>(undefined);
  const [importSuccess, setImportSuccess] = useState<string | undefined>(undefined);
  const [exportSuccess, setExportSuccess] = useState<string | undefined>(undefined);

  // Clear data dialog state
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  if (!isReady) {
    return (
      <Screen>
        <SettingsContainer>
          <Text tone="muted">Loading settings...</Text>
        </SettingsContainer>
      </Screen>
    );
  }

  // Only accessible when unlocked; otherwise show the PIN gate.
  if (!session.isUnlocked) {
    return (
      <Screen>
        <PinGate
          title="Parent settings"
          description="Enter your 4-digit PIN to access parent settings."
        />
      </Screen>
    );
  }

  const handleChangePinSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPinError(undefined);
    setPinSuccess(undefined);

    if (!session.isCryptoAvailable) {
      setPinError("Changing PIN requires a secure connection (HTTPS or localhost).");
      return;
    }

    if (!state.settings) {
      setPinError("Parent settings are missing.");
      return;
    }

    setIsChangingPin(true);
    try {
      const isCurrentValid = await verifyPin(currentPin, state.settings);
      if (!isCurrentValid) {
        setPinError("Current PIN is incorrect.");
        return;
      }

      if (!isValidPin(newPin)) {
        setPinError("The new PIN must be 4 digits.");
        return;
      }

      if (newPin !== confirmNewPin) {
        setPinError("New PINs do not match.");
        return;
      }

      const newRecord = await createPinRecord(newPin);
      actions.setSettings({
        ...state.settings,
        ...newRecord,
      });

      setPinSuccess("PIN changed successfully.");
      setCurrentPin("");
      setNewPin("");
      setConfirmNewPin("");
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Failed to change PIN.");
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const json = exportBackup(state);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "mycrohnie-backup.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setExportSuccess("Backup exported successfully.");
      setImportError(undefined);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to export backup.");
    }
  };

  const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(undefined);
    setImportSuccess(undefined);

    try {
      const content = await file.text();
      const imported = importBackup(content);
      actions.importState(imported);

      setImportSuccess("Backup imported successfully.");
    } catch (err) {
      setImportError(
        err instanceof Error
          ? `Invalid backup file: ${err.message}`
          : "Invalid backup file format.",
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleLoadDemo = async () => {
    try {
      const demoState = buildDemoState();
      actions.loadDemo(demoState);
      const demoPinRecord = await createPinRecord("1234");
      actions.setSettings({
        ...demoPinRecord,
        allowedMissionIds: demoState.settings?.allowedMissionIds ?? ALL_MISSIONS,
        deviceRole: "both",
      });
      setImportSuccess("Demo data loaded. Demo PIN is 1234.");
      setImportError(undefined);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to load demo data.");
    }
  };

  const handleConfirmClearAll = () => {
    actions.clearAll();
    session.lock();
    setIsClearDialogOpen(false);
    router.push(ROUTES.home);
  };

  return (
    <Screen>
      <SettingsContainer>
        <Stack gap="lg">
          <Stack gap="xs">
            <Stack gap="sm" direction="row" align="center">
              <Heading level={1}>Parent settings</Heading>
              {state.isDemo ? <Chip label="Demo data" tone="primary" /> : null}
            </Stack>
            <Text tone="muted">Manage security and app data.</Text>
          </Stack>

          <LinkButton href={ROUTES.parent} variant="secondary">
            ← Back to parent summary
          </LinkButton>

          {/* 1. Change PIN */}
          <Card label="Change PIN">
            <StyledForm onSubmit={handleChangePinSubmit}>
              <Heading level={2}>Change PIN</Heading>
              <Text size="sm" tone="muted">
                Enter your current 4-digit PIN, then choose a new one.
              </Text>

              {pinError ? (
                <AlertBox $variant="urgent" role="alert">
                  {pinError}
                </AlertBox>
              ) : null}

              {pinSuccess ? (
                <AlertBox $variant="success" role="status">
                  {pinSuccess}
                </AlertBox>
              ) : null}

              <TextField
                label="Current PIN"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={currentPin}
                onChange={(val) => {
                  setCurrentPin(val.replace(/\D/g, "").slice(0, 4));
                  if (pinError) setPinError(undefined);
                }}
                autoComplete="off"
              />

              <TextField
                label="New 4-digit PIN"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(val) => {
                  setNewPin(val.replace(/\D/g, "").slice(0, 4));
                  if (pinError) setPinError(undefined);
                }}
                autoComplete="off"
              />

              <TextField
                label="Confirm new PIN"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmNewPin}
                onChange={(val) => {
                  setConfirmNewPin(val.replace(/\D/g, "").slice(0, 4));
                  if (pinError) setPinError(undefined);
                }}
                autoComplete="off"
              />

              <Button
                type="submit"
                variant="primary"
                disabled={
                  currentPin.length !== 4 ||
                  newPin.length !== 4 ||
                  confirmNewPin.length !== 4 ||
                  isChangingPin
                }
              >
                Update PIN
              </Button>
            </StyledForm>
          </Card>

          {/* 2. Backup and restore */}
          <Card label="Backup and restore">
            <Stack gap="md">
              <Heading level={2}>Backup and restore</Heading>
              <Text size="sm" tone="muted">
                All data is stored only on this device. You can download a backup file or restore a
                previously saved backup.
              </Text>

              {importError ? (
                <AlertBox $variant="urgent" role="alert">
                  {importError}
                </AlertBox>
              ) : null}

              {importSuccess ? (
                <AlertBox $variant="success" role="status">
                  {importSuccess}
                </AlertBox>
              ) : null}

              {exportSuccess ? (
                <AlertBox $variant="success" role="status">
                  {exportSuccess}
                </AlertBox>
              ) : null}

              <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFileChange}
                aria-label="Import backup file input"
              />

              <Stack gap="sm">
                <Button variant="secondary" onClick={handleExportBackup}>
                  Export backup
                </Button>
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Import backup
                </Button>
              </Stack>
            </Stack>
          </Card>

          {/* 3. Demo data */}
          <Card label="Demo data">
            <Stack gap="md">
              <Heading level={2}>Demo data</Heading>
              <Text size="sm" tone="muted">
                Load 90 days of fictional sample data to test and preview the app features.
              </Text>
              {state.isDemo ? (
                <Card label="Demo PIN information">
                  <Stack gap="xs" direction="row" align="center">
                    <Chip label="Demo data" tone="primary" />
                    <Text size="sm">Demo PIN: 1234</Text>
                  </Stack>
                </Card>
              ) : null}
              <Button variant="secondary" onClick={handleLoadDemo}>
                Load demo data
              </Button>
            </Stack>
          </Card>

          {/* 4. Clear all data */}
          <Card label="Clear data">
            <Stack gap="md">
              <Heading level={2}>Clear all data</Heading>
              <Text size="sm" tone="muted">
                Permanently delete all child profile, check-ins, mission logs, and settings from
                this device.
              </Text>
              <Button variant="urgent" onClick={() => setIsClearDialogOpen(true)}>
                Clear all data
              </Button>
            </Stack>
          </Card>

          <Dialog
            open={isClearDialogOpen}
            title="Clear all data?"
            onClose={() => setIsClearDialogOpen(false)}
            closeLabel="Cancel"
          >
            <Stack gap="md">
              <Text>
                This will delete all health logs, notes, check-ins, missions, and settings from this
                device. This action cannot be undone.
              </Text>
              <Button variant="urgent" onClick={handleConfirmClearAll} fullWidth>
                Yes, delete everything
              </Button>
            </Stack>
          </Dialog>

          <Stack gap="sm">
            <Button variant="secondary" onClick={session.lock} fullWidth>
              Lock
            </Button>
            <LinkButton href={ROUTES.home} variant="secondary" fullWidth>
              Back to child mode
            </LinkButton>
          </Stack>
        </Stack>
      </SettingsContainer>
    </Screen>
  );
}
