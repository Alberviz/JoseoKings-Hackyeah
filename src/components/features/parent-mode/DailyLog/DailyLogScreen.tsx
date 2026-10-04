"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Chip,
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
import {
  formatAppointmentCountdown,
  formatConsultationDaysAgo,
  getConsultationSummary,
} from "@/lib/consultation/consultation";
import { addDays, isDateKey, todayKey } from "@/lib/dates";
import { hasPin } from "@/lib/pin";
import type {
  ActivityLevel,
  Consultation,
  MedicationTaken,
  ParentLog,
  SchoolDay,
  StoolBlood,
  StoolConsistency,
  StoolFrequency,
  StoolNight,
} from "@/types";
import { PinGate } from "../PinGate/PinGate";
import {
  AlertBox,
  ConsultationItem,
  ConsultationItemContent,
  ConsultationList,
  ConsultationRemoveButton,
  DailyLogContainer,
  DateLabel,
  DateNav,
  FormSection,
  QuickPillButton,
  QuickPillRow,
  SleepControlsRow,
  SleepSliderCard,
  SleepSliderHeader,
  SleepStepperButton,
  SleepValueBadge,
  StyledForm,
  StyledRangeInput,
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

const STOOL_FREQUENCY_OPTIONS: Array<{ value: StoolFrequency; label: string }> = [
  { value: "typical", label: "1–2 (Typical)" },
  { value: "more", label: "3–4 (More)" },
  { value: "much-more", label: "5+ (Much more)" },
  { value: "unknown", label: "Don't know" },
];

const STOOL_NIGHT_OPTIONS: Array<{ value: StoolNight; label: string }> = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes (woke up)" },
  { value: "unknown", label: "Don't know" },
];

const STOOL_CONSISTENCY_OPTIONS: Array<{ value: StoolConsistency; label: string }> = [
  { value: "formed", label: "Formed / Normal" },
  { value: "looser", label: "Looser than usual" },
  { value: "watery", label: "Watery / Liquid" },
  { value: "unknown", label: "Don't know" },
];

const STOOL_BLOOD_OPTIONS: Array<{ value: StoolBlood; label: string }> = [
  { value: "none", label: "No blood" },
  { value: "visible", label: "Visible" },
  { value: "unknown", label: "Don't know" },
];

type DayDraft = {
  sleepHours: string;
  activity: ActivityLevel | undefined;
  school: SchoolDay | undefined;
  medicationTaken: MedicationTaken | undefined;
  stoolFrequency: StoolFrequency | undefined;
  stoolNight: StoolNight | undefined;
  stoolConsistency: StoolConsistency | undefined;
  stoolBlood: StoolBlood | undefined;
  note: string;
};

function draftFromLog(log: ParentLog | undefined): DayDraft {
  if (!log) {
    return {
      sleepHours: "",
      activity: undefined,
      school: undefined,
      medicationTaken: undefined,
      stoolFrequency: undefined,
      stoolNight: undefined,
      stoolConsistency: undefined,
      stoolBlood: undefined,
      note: "",
    };
  }
  return {
    sleepHours: log.sleepHours === undefined ? "" : String(log.sleepHours),
    activity: log.activity,
    school: log.school,
    medicationTaken: log.medicationTaken,
    stoolFrequency: log.stoolFrequency,
    stoolNight: log.stoolNight,
    stoolConsistency: log.stoolConsistency,
    stoolBlood: log.stoolBlood,
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
      ...(draft.stoolFrequency ? { stoolFrequency: draft.stoolFrequency } : {}),
      ...(draft.stoolNight ? { stoolNight: draft.stoolNight } : {}),
      ...(draft.stoolConsistency ? { stoolConsistency: draft.stoolConsistency } : {}),
      ...(draft.stoolBlood ? { stoolBlood: draft.stoolBlood } : {}),
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

        <SleepSliderCard>
          <SleepSliderHeader>
            <Heading level={3}>Sleep hours</Heading>
            <SleepValueBadge $active={draft.sleepHours !== ""}>
              {draft.sleepHours === "" ? "Not recorded" : `${draft.sleepHours} hrs`}
            </SleepValueBadge>
          </SleepSliderHeader>

          <SleepControlsRow>
            <SleepStepperButton
              type="button"
              aria-label="Decrease sleep by 30 minutes"
              onClick={() => {
                const current = draft.sleepHours === "" ? 9 : Number(draft.sleepHours);
                const next = Math.max(0, Math.round((current - 0.5) * 10) / 10);
                setDraft((prev) => ({ ...prev, sleepHours: String(next) }));
              }}
            >
              − 0.5h
            </SleepStepperButton>

            <StyledRangeInput
              min={0}
              max={16}
              step={0.5}
              value={draft.sleepHours === "" ? 9 : draft.sleepHours}
              aria-label="Sleep hours"
              aria-valuenow={draft.sleepHours === "" ? undefined : Number(draft.sleepHours)}
              aria-valuemin={0}
              aria-valuemax={16}
              aria-valuetext={
                draft.sleepHours === "" ? "Not recorded" : `${draft.sleepHours} hours`
              }
              onChange={(e) => {
                setDraft((prev) => ({ ...prev, sleepHours: e.target.value }));
              }}
            />

            <SleepStepperButton
              type="button"
              aria-label="Increase sleep by 30 minutes"
              onClick={() => {
                const current = draft.sleepHours === "" ? 9 : Number(draft.sleepHours);
                const next = Math.min(16, Math.round((current + 0.5) * 10) / 10);
                setDraft((prev) => ({ ...prev, sleepHours: String(next) }));
              }}
            >
              + 0.5h
            </SleepStepperButton>
          </SleepControlsRow>

          <QuickPillRow aria-label="Quick sleep hours">
            {[7, 8, 9, 10].map((hours) => (
              <QuickPillButton
                key={hours}
                type="button"
                $selected={draft.sleepHours === String(hours)}
                aria-pressed={draft.sleepHours === String(hours)}
                onClick={() => setDraft((prev) => ({ ...prev, sleepHours: String(hours) }))}
              >
                {hours}h
              </QuickPillButton>
            ))}
            <QuickPillButton
              type="button"
              $selected={draft.sleepHours === ""}
              onClick={() => setDraft((prev) => ({ ...prev, sleepHours: "" }))}
            >
              Clear
            </QuickPillButton>
          </QuickPillRow>
        </SleepSliderCard>

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

        <FormSection>
          <Heading level={3}>Bathroom observations</Heading>
          <Text size="sm" tone="muted">
            Factual daily bowel observations. Only record what you know naturally — no need to ask
            or press your child. All items are optional.
          </Text>

          <OptionGroup legend="Bowel frequency (times today)" columns={2}>
            {STOOL_FREQUENCY_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={draft.stoolFrequency === option.value}
                onSelect={() =>
                  setDraft((prev) => ({
                    ...prev,
                    stoolFrequency: prev.stoolFrequency === option.value ? undefined : option.value,
                  }))
                }
              />
            ))}
          </OptionGroup>

          <OptionGroup legend="Woke up at night to go?" columns={3}>
            {STOOL_NIGHT_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={draft.stoolNight === option.value}
                onSelect={() =>
                  setDraft((prev) => ({
                    ...prev,
                    stoolNight: prev.stoolNight === option.value ? undefined : option.value,
                  }))
                }
              />
            ))}
          </OptionGroup>

          <OptionGroup legend="Stool consistency" columns={2}>
            {STOOL_CONSISTENCY_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={draft.stoolConsistency === option.value}
                onSelect={() =>
                  setDraft((prev) => ({
                    ...prev,
                    stoolConsistency:
                      prev.stoolConsistency === option.value ? undefined : option.value,
                  }))
                }
              />
            ))}
          </OptionGroup>

          <OptionGroup legend="Visible blood in stool?" columns={3}>
            {STOOL_BLOOD_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={draft.stoolBlood === option.value}
                onSelect={() =>
                  setDraft((prev) => ({
                    ...prev,
                    stoolBlood: prev.stoolBlood === option.value ? undefined : option.value,
                  }))
                }
              />
            ))}
          </OptionGroup>
        </FormSection>

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

  const today = todayKey();

  const consultationSummary = useMemo(
    () => getConsultationSummary(state.consultations, today),
    [state.consultations, today],
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

  const handleRemoveConsultation = (id: string) => {
    actions.removeConsultation(id);
    setConsultationMessage("Consultation removed.");
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
              <Heading level={2}>Consultations and appointments</Heading>
              <Text size="sm" tone="muted">
                Mark past visits or schedule your next appointment. The doctor report uses the time
                since the last consultation.
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
                  hint="Select a past consultation date or future appointment."
                  required
                />
                <Button type="submit" variant="secondary" fullWidth>
                  Add consultation date
                </Button>
              </StyledForm>

              {sortedConsultations.length === 0 ? (
                <Text tone="muted">No consultation dates yet.</Text>
              ) : (
                <Stack gap="md">
                  {consultationSummary.upcoming.length > 0 ? (
                    <Stack gap="sm">
                      <Heading level={3}>Upcoming appointments</Heading>
                      <ConsultationList aria-label="Upcoming appointments">
                        {consultationSummary.upcoming.map((item) => (
                          <ConsultationItem key={item.id}>
                            <ConsultationItemContent>
                              <Text>{item.date}</Text>
                              <Chip
                                label={formatAppointmentCountdown(today, item.date)}
                                tone="primary"
                              />
                            </ConsultationItemContent>
                            <ConsultationRemoveButton
                              type="button"
                              aria-label={`Remove appointment ${item.date}`}
                              onClick={() => handleRemoveConsultation(item.id)}
                            >
                              Remove
                            </ConsultationRemoveButton>
                          </ConsultationItem>
                        ))}
                      </ConsultationList>
                    </Stack>
                  ) : null}

                  {consultationSummary.past.length > 0 ? (
                    <Stack gap="sm">
                      <Heading level={3}>Past consultations</Heading>
                      <ConsultationList aria-label="Past consultations">
                        {consultationSummary.past.map((item) => (
                          <ConsultationItem key={item.id}>
                            <ConsultationItemContent>
                              <Text>{item.date}</Text>
                              <Text size="sm" tone="muted">
                                {formatConsultationDaysAgo(today, item.date)}
                              </Text>
                            </ConsultationItemContent>
                            <ConsultationRemoveButton
                              type="button"
                              aria-label={`Remove consultation ${item.date}`}
                              onClick={() => handleRemoveConsultation(item.id)}
                            >
                              Remove
                            </ConsultationRemoveButton>
                          </ConsultationItem>
                        ))}
                      </ConsultationList>
                    </Stack>
                  ) : null}
                </Stack>
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
