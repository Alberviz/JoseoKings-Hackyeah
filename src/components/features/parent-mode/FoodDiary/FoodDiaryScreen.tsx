"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button, Chip, Heading, Screen, Stack, Text, TextField } from "@/components/ui";
import { DISCOMFORT_THRESHOLD, QUESTION_IDS } from "@/config/content-ids";
import { PATTERNS_DISCLAIMER } from "@/content";
import { useAppState } from "@/hooks/useAppState";
import { useParentSession } from "@/hooks/useParentSession";
import { isDateKey, todayKey } from "@/lib/dates";
import { hasPin } from "@/lib/pin";
import type { DateKey, FoodEntry } from "@/types";
import { ParentBanner } from "../ParentBanner/ParentBanner";
import { PinGate } from "../PinGate/PinGate";
import { SectionCard } from "../SectionCard/SectionCard";
import { SECTION_BUTTON_VARIANT } from "../sections";
import {
  AlertBox,
  DiscomfortBadge,
  FoodDiaryContainer,
  FoodEntryDate,
  FoodEntryHeader,
  FoodEntryItem,
  FoodEntryList,
  FoodEntryText,
  FoodForm,
  PromptBanner,
} from "./FoodDiaryScreen.style";

export function FoodDiaryScreen() {
  const { state, actions, isReady } = useAppState();
  const session = useParentSession();

  const today = todayKey();
  const childName = state.child?.nickname ?? "your child";

  const [selectedDate, setSelectedDate] = useState<DateKey>(today);
  const [foodText, setFoodText] = useState("");
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);

  const hasConfiguredPin = hasPin(state.settings);

  // Check today's check-in for the reactive prompt
  const todayCheckIn = useMemo(
    () => state.checkIns.find((c) => c.date === today),
    [state.checkIns, today],
  );
  const todayHasDiscomfort = useMemo(() => {
    const belly = todayCheckIn?.answers[QUESTION_IDS.bellyComfort];
    return typeof belly === "number" && belly >= DISCOMFORT_THRESHOLD;
  }, [todayCheckIn]);

  // Check whether the selected date had a discomfort check-in
  const selectedDateCheckIn = useMemo(
    () => state.checkIns.find((c) => c.date === selectedDate),
    [state.checkIns, selectedDate],
  );
  const selectedDateHasDiscomfort = useMemo(() => {
    const belly = selectedDateCheckIn?.answers[QUESTION_IDS.bellyComfort];
    return typeof belly === "number" && belly >= DISCOMFORT_THRESHOLD;
  }, [selectedDateCheckIn]);

  // Sort entries descending by date and time
  const sortedEntries = useMemo(() => {
    return [...state.foodEntries].sort(
      (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    );
  }, [state.foodEntries]);

  if (!isReady) {
    return (
      <Screen>
        <FoodDiaryContainer>
          <Text tone="muted">Loading food diary...</Text>
        </FoodDiaryContainer>
      </Screen>
    );
  }

  if (!state.child || !hasConfiguredPin) {
    return (
      <Screen>
        <FoodDiaryContainer>
          <PinGate
            title="Setup needed"
            description="Parent mode requires a child profile and a 4-digit PIN."
          />
        </FoodDiaryContainer>
      </Screen>
    );
  }

  if (!session.isUnlocked) {
    return (
      <Screen>
        <FoodDiaryContainer>
          <PinGate
            title="Parent food diary"
            description="Enter your 4-digit PIN to access the food diary."
          />
        </FoodDiaryContainer>
      </Screen>
    );
  }

  const handleAddEntry = (event: FormEvent) => {
    event.preventDefault();
    setFormError(undefined);
    setSuccessMessage(undefined);

    const trimmed = foodText.trim();
    if (trimmed.length < 2) {
      setFormError("Please enter what was eaten.");
      return;
    }

    if (!isDateKey(selectedDate)) {
      setFormError("Please enter a valid date (YYYY-MM-DD).");
      return;
    }

    const newEntry: FoodEntry = {
      id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: selectedDate,
      text: trimmed,
      relatedCheckInId: selectedDateHasDiscomfort ? selectedDateCheckIn?.id : undefined,
      createdAt: new Date().toISOString(),
    };

    actions.addFoodEntry(newEntry);
    setFoodText("");
    setSuccessMessage("Food entry saved.");
  };

  return (
    <Screen>
      <FoodDiaryContainer>
        <Stack gap="lg">
          <ParentBanner
            section="food"
            icon="food"
            title="Food diary"
            subtitle={
              <>
                Notes to share with the care team
                {state.isDemo ? <Chip label="Demo data" tone="primary" /> : null}
              </>
            }
          />

          {/* Reactive prompt when today's check-in has discomfort */}
          {todayHasDiscomfort ? (
            <PromptBanner role="region" aria-label="Food note prompt">
              <Heading level={2}>Want to note what {childName} ate today?</Heading>
              <Text size="sm">
                {childName} marked discomfort on today&apos;s check-in. Noting meals as plain facts
                helps talk about observations during care team visits.
              </Text>
            </PromptBanner>
          ) : null}

          {/* Add food entry card */}
          <SectionCard section="food" title="Add food note" label="Log food entry">
            <FoodForm onSubmit={handleAddEntry} noValidate>
              <Text size="sm" tone="muted">
                Write meals or drinks as plain text. Food notes show co-occurrence only, never as
                causes.
              </Text>

              {formError ? (
                <AlertBox $variant="urgent" role="alert">
                  {formError}
                </AlertBox>
              ) : null}

              {successMessage ? (
                <AlertBox $variant="success" role="status">
                  {successMessage}
                </AlertBox>
              ) : null}

              <TextField
                label="Date"
                type="date"
                value={selectedDate}
                onChange={(val) => {
                  if (isDateKey(val)) {
                    setSelectedDate(val);
                  }
                  if (formError) setFormError(undefined);
                }}
                required
              />

              {selectedDateHasDiscomfort ? (
                <DiscomfortBadge>
                  {childName} marked discomfort on this day (entry will link to this check-in).
                </DiscomfortBadge>
              ) : null}

              <TextField
                label="What was eaten?"
                multiline
                rows={3}
                placeholder="e.g. Scrambled eggs and toast for breakfast, chicken soup with rice for dinner"
                value={foodText}
                onChange={(val) => {
                  setFoodText(val);
                  if (formError) setFormError(undefined);
                }}
                required
              />

              <Button type="submit" variant={SECTION_BUTTON_VARIANT.food} fullWidth>
                Save food entry
              </Button>
            </FoodForm>
          </SectionCard>

          {/* List of food entries */}
          <SectionCard section="food" title="Recorded foods" label="Food history">
            <Stack gap="md">
              {sortedEntries.length === 0 ? (
                <Text tone="muted">
                  No food entries recorded yet. You can use this diary to note meals and snacks to
                  discuss with your healthcare team.
                </Text>
              ) : (
                <FoodEntryList aria-label="Recorded food entries">
                  {sortedEntries.map((entry) => (
                    <FoodEntryItem key={entry.id}>
                      <FoodEntryHeader>
                        <FoodEntryDate>{entry.date}</FoodEntryDate>
                        {entry.relatedCheckInId ? (
                          <Chip label="Linked to discomfort day" tone="primary" />
                        ) : null}
                      </FoodEntryHeader>
                      <FoodEntryText>{entry.text}</FoodEntryText>
                    </FoodEntryItem>
                  ))}
                </FoodEntryList>
              )}
            </Stack>
          </SectionCard>

          <SectionCard section="food" title="Notice">
            <Text tone="muted" size="sm">
              {PATTERNS_DISCLAIMER}
            </Text>
          </SectionCard>

          <Stack gap="sm">
            <Button variant="secondary" onClick={session.lock} fullWidth>
              Lock
            </Button>
          </Stack>
        </Stack>
      </FoodDiaryContainer>
    </Screen>
  );
}
