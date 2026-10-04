"use client";

import { useState, type FormEvent } from "react";
import { Button, TextField } from "@/components/ui";
import { SPECIAL_REWARD_COST_MAX, SPECIAL_REWARD_NAME_MAX_LENGTH } from "@/config/economy";
import { parseRewardDraft } from "@/lib/economy";
import { SECTION_BUTTON_VARIANT } from "../sections";
import { FormActions, FormContainer } from "./RewardForm.style";

type RewardFormProps = {
  initialName?: string;
  initialCost?: number;
  submitLabel: string;
  /** Called with a valid name and price. The form clears itself after it returns. */
  onSubmit: (name: string, fireCost: number) => void;
  onCancel?: () => void;
};

type FieldErrors = { name?: string; cost?: string };

// Name and fire price of one special reward. Used to add a new reward and to edit one.
export function RewardForm({
  initialName = "",
  initialCost,
  submitLabel,
  onSubmit,
  onCancel,
}: RewardFormProps) {
  const [name, setName] = useState(initialName);
  const [cost, setCost] = useState(initialCost === undefined ? "" : String(initialCost));
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = parseRewardDraft(name, cost);
    if (!result.ok) {
      setErrors(result.field === "name" ? { name: result.message } : { cost: result.message });
      return;
    }
    setErrors({});
    onSubmit(result.name, result.fireCost);
    if (initialCost === undefined) {
      setName("");
      setCost("");
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit} noValidate>
      <TextField
        label="Reward name"
        value={name}
        onChange={setName}
        maxLength={SPECIAL_REWARD_NAME_MAX_LENGTH}
        hint="Something to do or share together."
        error={errors.name}
      />
      <TextField
        label="Price in fire"
        value={cost}
        onChange={setCost}
        inputMode="numeric"
        maxLength={String(SPECIAL_REWARD_COST_MAX).length}
        hint={`A whole number from 1 to ${SPECIAL_REWARD_COST_MAX}.`}
        error={errors.cost}
      />
      <FormActions>
        <Button type="submit" variant={SECTION_BUTTON_VARIANT.more}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </FormActions>
    </FormContainer>
  );
}
