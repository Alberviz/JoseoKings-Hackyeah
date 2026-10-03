"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Heading,
  LinkButton,
  OptionButton,
  OptionGroup,
  Screen,
  Stack,
  Text,
  TextField,
} from "@/components/ui";
import { ROUTES } from "@/config/app";
import { useAppState } from "@/hooks/useAppState";
import { useParentSession } from "@/hooks/useParentSession";
import { addDays, isDateKey, todayKey } from "@/lib/dates";
import { hasPin } from "@/lib/pin";
import type { ActivityLevel, Consultation, MedicationTaken, ParentLog, SchoolDay } from "@/types";
import { PinGate } from "../PinGate/PinGate";
import {
  AlertBox,
  ConsultationItem,
  ConsultationList,
  DailyLogContainer,
  DateLabel,
  DateNav,
  StyledForm,
} from "./DailyLogScreen.style";

const ACTIVITY_OPTIONS: Array<{ value: ActivityLevel; label: string }> = [
  { value: "none", label: "None" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
];

const SCHOOL_OPTIONS: Array<{ value: SchoolDay; label: string }> = [
  { value: "attended", label: "Went" },
  { value: "left-early", label: "Left early" },
  { value: "missed", label: "Missed" },
  { value: "no-school", label: "No school" },
];

const MEDICATION_OPTIONS: Array<{ value: MedicationTaken; label: string }> = [
  { value: "yes", label: "Yes" },
  { value: "partly", label: "Partly" },
  { value: "no", label: "No" },
  { value: "not-applicable", label: "N/A" },
];

type DayDraft = {
  sleepHours: string;
  activity: ActivityLevel | undefined;
  school: SchoolDay | undefined;
  medicationTaken: MedicationTaken | undefined;
  note: string;
};

function draftFromLog(log: ParentLog | undefined): DayDraft {
  if (!log) {
    return {
      sleepHours: "",
      activity: undefined,
      school: undefined,
      medicationTaken: undefined,
      note: "",
    };
  }
  return {
    sleepHours: log.sleepHours === undefined ? "" : String(log.sleepHours),
    activity: log.activity,
    school: log.school,
    medicationTaken: log.medicationTaken,
    note: log.note ?? "",
  };
}

type DayFormProps = {
  date: string;
  initialLog: ParentLog | undefined;
  onSave: (log: ParentLog) => void;
};

function DayForm({ date, initialLog, onSave }: DayFormProps) {
  const [draft, setDraft] = useState(() => draftFromLog(initialLog));
  const [saveMessage, setSaveMessage] = useState<string | undefined>();

  const handleSaveLog = (event: FormEvent) => {
    event.preventDefault();

    let parsedSleep: number | undefined;
    if (draft.sleepHours.trim() !== "") {
      const value = Number(draft.sleepHours);
      if (!Number.isFinite(value) || value < 0 || value > 24) {
        setSaveMessage("Sleep hours must be a number between 0 and 24.");
        return;
      }
      parsedSleep = value;
    }

    const log: ParentLog = {
      date,
      ...(parsedSleep !== undefined ? { sleepHours: parsedSleep } : {}),
      ...(draft.activity ? { activity: draft.activity } : {}),
      ...(draft.school ? { school: draft.school } : {}),
      ...(draft.medicationTaken ? { medicationTaken: draft.medicationTaken } : {}),
      ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    };

    onSave(log);
    setSaveMessage("Daily log saved.");
  };

  return (
    <Card label="Daily facts">
      <StyledForm onSubmit={handleSaveLog}>
        <Heading level={2}>Daily facts</Heading>
        <Text size="sm" tone="muted">
          Edit any past day. Saving replaces the log for that day.
        </Text>

        {saveMessage ? (
          <AlertBox $variant={saveMessage.includes("must be") ? "urgent" : "success"} role="status">
            {saveMessage}
          </AlertBox>
        ) : null}

        <TextField
          label="Sleep hours"
          type="number"
          inputMode="decimal"
          value={draft.sleepHours}
          onChange={(value) => setDraft((prev) => ({ ...prev, sleepHours: value }))}
          hint="Optional. Number of hours slept."
        />

        <OptionGroup legend="Physical activity" columns={2}>
          {ACTIVITY_OPTIONS.map((option) => (
            <OptionButton
              key={option.value}
              label={option.label}
              selected={draft.activity === option.value}
              onSelect={() => setDraft((prev) => ({ ...prev, activity: option.value }))}
            />
          ))}
        </OptionGroup>

        <OptionGroup legend="School" columns={2}>
          {SCHOOL_OPTIONS.map((option) => (
            <OptionButton
              key={option.value}
              label={option.label}
              selected={draft.school === option.value}
              onSelect={() => setDraft((prev) => ({ ...prev, school: option.value }))}
            />
          ))}
        </OptionGroup>

        <OptionGroup legend="Medication taken" columns={2}>
          {MEDICATION_OPTIONS.map((option) => (
            <OptionButton
              key={option.value}
              label={option.label}
              selected={draft.medicationTaken === option.value}
              onSelect={() => setDraft((prev) => ({ ...prev, medicationTaken: option.value }))}
            />
          ))}
        </OptionGroup>
        <Text size="sm" tone="muted">
          Yes, partly, no, or not applicable. Do not write medicine names or doses.
        </Text>

        <TextField
          label="Note"
          value={draft.note}
          onChange={(value) => setDraft((prev) => ({ ...prev, note: value }))}
          multiline
          rows={3}
          hint="Optional free text. Avoid medicine names."
          maxLength={500}
        />

        <Button type="submit" variant="primary" fullWidth>
          Save day
        </Button>
      </StyledForm>
    </Card>
  );
}

export function DailyLogScreen() {
  const router = useRouter();
  const { state, actions, isReady } = useAppState();
  const session = useParentSession();

  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [consultationDate, setConsultationDate] = useState("");
  const [consultationError, setConsultationError] = useState<string | undefined>();
  const [consultationMessage, setConsultationMessage] = useState<string | undefined>();

  const hasConfiguredPin = hasPin(state.settings);

  const selectedLog = useMemo(
    () => state.parentLogs.find((log) => log.date === selectedDate),
    [state.parentLogs, selectedDate],
  );

  const sortedConsultations = useMemo(
    () => [...state.consultations].sort((a, b) => b.date.localeCompare(a.date)),
    [state.consultations],
  );

  useEffect(() => {
    if (!isReady) return;
    if (!state.child || !hasConfiguredPin) {
      router.replace(ROUTES.parentSetup);
    }
  }, [isReady, state.child, hasConfiguredPin, router]);

  const selectDate = (nextDate: string) => {
    if (!isDateKey(nextDate)) return;
    if (nextDate > todayKey()) return;
    setSelectedDate(nextDate);
  };

  if (!isReady) {
    return (
      <Screen>
        <DailyLogContainer>
          <Text tone="muted">Loading daily log...</Text>
        </DailyLogContainer>
      </Screen>
    );
  }

  if (!state.child || !hasConfiguredPin) {
    return (
      <Screen>
        <DailyLogContainer>
          <PinGate
            title="Setup needed"
            description="Parent mode requires a child profile and a 4-digit PIN."
          />
        </DailyLogContainer>
      </Screen>
    );
  }

  if (!session.isUnlocked) {
    return (
      <Screen>
        <DailyLogContainer>
          <PinGate />
        </DailyLogContainer>
      </Screen>
    );
  }

  const childName = state.child.nickname.trim();
  const today = todayKey();
  const canGoNext = selectedDate < today;

  const handleAddConsultation = (event: FormEvent) => {
    event.preventDefault();
    setConsultationError(undefined);
    setConsultationMessage(undefined);

    if (!isDateKey(consultationDate)) {
      setConsultationError("Enter a valid consultation date.");
      return;
    }

    const alreadyListed = state.consultations.some((item) => item.date === consultationDate);
    if (alreadyListed) {
      setConsultationError("That consultation date is already listed.");
      return;
    }

    const consultation: Consultation = {
      id: crypto.randomUUID(),
      date: consultationDate,
    };
    actions.addConsultation(consultation);
    setConsultationDate("");
    setConsultationMessage("Consultation date added.");
  };

  return (
    <Screen>
      <DailyLogContainer>
        <Stack gap="lg">
          <Stack gap="xs">
            <Heading level={1}>Daily log</Heading>
            <Text tone="muted">{`Facts for ${childName}. No drug names or doses.`}</Text>
          </Stack>

          <Card label="Day">
            <Stack gap="md">
              <Heading level={2}>Day</Heading>
              <DateNav>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => selectDate(addDays(selectedDate, -1))}
                >
                  Previous day
                </Button>
                <DateLabel>{selectedDate}</DateLabel>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!canGoNext}
                  onClick={() => selectDate(addDays(selectedDate, 1))}
                >
                  Next day
                </Button>
              </DateNav>
              <TextField
                label="Jump to date"
                type="date"
                value={selectedDate}
                onChange={(value) => selectDate(value)}
              />
            </Stack>
          </Card>

          <DayForm
            key={selectedDate}
            date={selectedDate}
            initialLog={selectedLog}
            onSave={actions.saveParentLog}
          />

          <Card label="Consultations">
            <Stack gap="md">
              <Heading level={2}>Consultations</Heading>
              <Text size="sm" tone="muted">
                Mark visit dates. The doctor report uses the time since the last consultation.
              </Text>

              <StyledForm onSubmit={handleAddConsultation}>
                {consultationError ? (
                  <AlertBox $variant="urgent" role="alert">
                    {consultationError}
                  </AlertBox>
                ) : null}
                {consultationMessage ? (
                  <AlertBox $variant="success" role="status">
                    {consultationMessage}
                  </AlertBox>
                ) : null}
                <TextField
                  label="Consultation date"
                  type="date"
                  value={consultationDate}
                  onChange={setConsultationDate}
                  required
                />
                <Button type="submit" variant="secondary" fullWidth>
                  Add consultation date
                </Button>
              </StyledForm>

              {sortedConsultations.length === 0 ? (
                <Text tone="muted">No consultation dates yet.</Text>
              ) : (
                <ConsultationList aria-label="Consultation dates">
                  {sortedConsultations.map((item) => (
                    <ConsultationItem key={item.id}>
                      <Text>{item.date}</Text>
                    </ConsultationItem>
                  ))}
                </ConsultationList>
              )}
            </Stack>
          </Card>

          <Stack gap="sm">
            <LinkButton href={ROUTES.parent} variant="secondary" fullWidth>
              Back to parent summary
            </LinkButton>
            <Button type="button" variant="secondary" onClick={session.lock} fullWidth>
              Lock
            </Button>
          </Stack>
        </Stack>
      </DailyLogContainer>
    </Screen>
  );
}
