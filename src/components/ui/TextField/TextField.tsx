"use client";

import { useId, type HTMLInputTypeAttribute } from "react";
import {
  FieldContainer,
  FieldHint,
  FieldLabel,
  StyledInput,
  StyledTextarea,
} from "./TextField.style";

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: HTMLInputTypeAttribute;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  error?: string;
  name?: string;
  placeholder?: string;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "decimal";
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
};

// A labelled text input. The value is the string itself, not the event.
export function TextField({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
  rows = 3,
  hint,
  error,
  name,
  placeholder,
  maxLength,
  inputMode,
  autoComplete = "off",
  disabled = false,
  required = false,
}: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  const common = {
    id,
    name,
    value,
    placeholder,
    maxLength,
    disabled,
    required,
    autoComplete,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": message ? messageId : undefined,
    $hasError: Boolean(error),
  };

  return (
    <FieldContainer>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multiline ? (
        <StyledTextarea
          {...common}
          rows={rows}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <StyledInput
          {...common}
          type={type}
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {message ? (
        <FieldHint id={messageId} $isError={Boolean(error)} role={error ? "alert" : undefined}>
          {message}
        </FieldHint>
      ) : null}
    </FieldContainer>
  );
}
