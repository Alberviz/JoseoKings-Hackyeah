"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Chip,
  Dialog,
  LinkButton,
  OptionButton,
  OptionGroup,
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
import type { DeviceRole } from "@/types";
import {
  DEFAULT_REMINDER_TIME,
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
  triggerLocalReminder,
} from "@/lib/reminder/reminder";
import { formatMissionTitle } from "../missionLabels";
import { ParentBanner } from "../ParentBanner/ParentBanner";
import { SectionCard } from "../SectionCard/SectionCard";
import { SECTION_BUTTON_VARIANT } from "../sections";
import { PinGate } from "../PinGate/PinGate";
import {
  AlertBox,
  ChipWrap,
  HiddenFileInput,
  SettingsContainer,
  StyledForm,
  SubtitleRow,
} from "./SettingsScreen.style";

const ALL_MISSIONS = Object.values(MISSION_IDS);

export function SettingsScreen() {
  const router = useRouter();
  const { state, actions, isReady } = useAppState();
  const session = useParentSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Daily care reminder state
  const [notificationPermission, setNotificationPermission] = useState(() =>
    getNotificationPermission(),
  );
  const [reminderMessage, setReminderMessage] = useState<string | undefined>(undefined);

  // Enabled missions state
  const [missionsError, setMissionsError] = useState<string | undefined>(undefined);

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

  const enabledMissions = state.settings?.allowedMissionIds ?? ALL_MISSIONS;
  const currentDeviceRole: DeviceRole = state.settings?.deviceRole ?? "both";

  const handleDeviceRoleChange = (role: DeviceRole) => {
    if (!state.settings) return;
    actions.setSettings({
      ...state.settings,
      deviceRole: role,
    });
  };

  const handleToggleMission = (missionId: string) => {
    if (!state.settings) return;
    const exists = enabledMissions.includes(missionId);
    if (exists && enabledMissions.length === 1) {
      setMissionsError("At least one mission must be enabled.");
      return;
    }

    const nextMissions = exists
      ? enabledMissions.filter((id) => id !== missionId)
      : [...enabledMissions, missionId];

    setMissionsError(undefined);
    actions.setSettings({
      ...state.settings,
      allowedMissionIds: nextMissions,
    });
  };

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
          <ParentBanner
            section="more"
            icon="settings"
            title="Parent settings"
            hasGear={false}
            subtitle={
              <SubtitleRow>
                This phone
                {state.isDemo ? <Chip label="Demo data" tone="primary" /> : null}
              </SubtitleRow>
            }
          />

          {/* Device role */}
          <SectionCard section="more" title="This phone is for" label="Device role">
            <Stack gap="md">
              <Text size="sm" tone="muted">
                Choose how this phone is used. Child-only phones hide parent shortcuts, and
                parent-only phones open directly in parent mode.
              </Text>
              <OptionGroup legend="This phone is for" hideLegend columns={3}>
                <OptionButton
                  label="My child"
                  selected={currentDeviceRole === "child"}
                  onSelect={() => handleDeviceRoleChange("child")}
                />
                <OptionButton
                  label="Me (parent)"
                  selected={currentDeviceRole === "parent"}
                  onSelect={() => handleDeviceRoleChange("parent")}
                />
                <OptionButton
                  label="Both"
                  selected={currentDeviceRole === "both"}
                  onSelect={() => handleDeviceRoleChange("both")}
                />
              </OptionGroup>
            </Stack>
          </SectionCard>

          {/* 1. Enabled missions */}
          <SectionCard section="more" title="Enabled missions">
            <Stack gap="md">
              <Text size="sm" tone="muted">
                Choose which missions appear in child mode. At least one mission must be enabled.
              </Text>
              <ChipWrap>
                {ALL_MISSIONS.map((id) => (
                  <Chip
                    key={id}
                    label={formatMissionTitle(id)}
                    selected={enabledMissions.includes(id)}
                    onToggle={() => handleToggleMission(id)}
                  />
                ))}
              </ChipWrap>
              {missionsError ? (
                <AlertBox $variant="urgent" role="alert">
                  {missionsError}
                </AlertBox>
              ) : null}
            </Stack>
          </SectionCard>

          {/* Daily care reminder */}
          <SectionCard section="more" title="Daily care reminder">
            <Stack gap="md">
              <Text size="sm" tone="muted">
                A local device reminder to record or follow today&apos;s routine. No drug names or
                doses are ever stored or shown.
              </Text>

              <OptionGroup legend="Daily reminder" columns={2}>
                <OptionButton
                  label="Enabled"
                  selected={Boolean(state.settings?.reminderEnabled)}
                  onSelect={() => {
                    if (!state.settings) return;
                    actions.setSettings({
                      ...state.settings,
                      reminderEnabled: true,
                      reminderTime: state.settings.reminderTime ?? DEFAULT_REMINDER_TIME,
                    });
                  }}
                />
                <OptionButton
                  label="Disabled"
                  selected={!state.settings?.reminderEnabled}
                  onSelect={() => {
                    if (!state.settings) return;
                    actions.setSettings({
                      ...state.settings,
                      reminderEnabled: false,
                    });
                  }}
                />
              </OptionGroup>

              {state.settings?.reminderEnabled ? (
                <Stack gap="sm">
                  <TextField
                    label="Reminder time"
                    type="time"
                    value={state.settings.reminderTime ?? DEFAULT_REMINDER_TIME}
                    onChange={(value) => {
                      if (!state.settings) return;
                      actions.setSettings({
                        ...state.settings,
                        reminderTime: value,
                      });
                    }}
                    hint="Local time when you would like to be reminded each day."
                  />

                  {isNotificationSupported() ? (
                    <Stack gap="xs">
                      {notificationPermission === "granted" ? (
                        <AlertBox $variant="success">
                          Local notifications are permitted on this device.
                        </AlertBox>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={async () => {
                            const granted = await requestNotificationPermission();
                            setNotificationPermission(getNotificationPermission());
                            if (granted) {
                              setReminderMessage("Device notifications enabled.");
                            }
                          }}
                        >
                          Enable device notifications
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          const childName = state.child?.nickname ?? "your child";
                          const sent = triggerLocalReminder(childName);
                          if (sent) {
                            setReminderMessage("Test notification sent.");
                          } else {
                            setReminderMessage("Test reminder shown via in-app banner.");
                          }
                        }}
                      >
                        Send test reminder
                      </Button>
                    </Stack>
                  ) : (
                    <Text size="sm" tone="muted">
                      Device notifications not available in this browser. A gentle in-app banner
                      will appear when due.
                    </Text>
                  )}

                  {reminderMessage ? (
                    <AlertBox $variant="success" role="status">
                      {reminderMessage}
                    </AlertBox>
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
          </SectionCard>

          {/* 2. Change PIN */}
          <SectionCard section="more" title="Change PIN">
            <StyledForm onSubmit={handleChangePinSubmit}>
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
                variant={SECTION_BUTTON_VARIANT.more}
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
          </SectionCard>

          {/* 3. Backup and restore */}
          <SectionCard section="more" title="Backup and restore">
            <Stack gap="md">
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
          </SectionCard>

          {/* 4. Demo data */}
          <SectionCard section="more" title="Demo data">
            <Stack gap="md">
              <Text size="sm" tone="muted">
                Load 90 days of fictional sample data to test and preview the app features.
              </Text>
              {state.isDemo ? (
                <AlertBox $variant="info" aria-label="Demo PIN information">
                  <Stack gap="xs" direction="row" align="center">
                    <Chip label="Demo data" tone="primary" />
                    <Text size="sm">Demo PIN: 1234</Text>
                  </Stack>
                </AlertBox>
              ) : null}
              <Button variant="secondary" onClick={handleLoadDemo}>
                Load demo data
              </Button>
            </Stack>
          </SectionCard>

          {/* 5. Clear all data */}
          <SectionCard section="more" title="Clear all data" label="Clear data">
            <Stack gap="md">
              <Text size="sm" tone="muted">
                Permanently delete all child profile, check-ins, mission logs, and settings from
                this device.
              </Text>
              <Button variant="urgent" onClick={() => setIsClearDialogOpen(true)}>
                Clear all data
              </Button>
            </Stack>
          </SectionCard>

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
            {state.settings?.deviceRole !== "parent" ? (
              <LinkButton href={ROUTES.home} variant="secondary" fullWidth>
                Back to child mode
              </LinkButton>
            ) : null}
          </Stack>
        </Stack>
      </SettingsContainer>
    </Screen>
  );
}
