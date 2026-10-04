// Child check-in: a few taps on drawings. The exact questions live in src/content/check-in-questions.ts.

/** Local calendar day, "YYYY-MM-DD". Never a UTC timestamp. */
export type DateKey = string;

export type CheckInQuestionKind = "faces" | "counter" | "battery";

export type CheckInOption = {
  /** Numeric value stored in the answer. Higher is not always "better": the meaning depends on the question. */
  value: number;
  /** Short label read by screen readers and shown under the drawing. */
  label: string;
  /** Key of the drawing to render (chosen by the UI, not a file path). */
  iconKey: string;
};

export type CheckInQuestion = {
  id: string;
  kind: CheckInQuestionKind;
  /** Child-facing wording, simple English, no medical terms. */
  prompt: string;
  options: CheckInOption[];
};

export type CheckInAnswer = number | "skipped";

export type CheckIn = {
  id: string;
  date: DateKey;
  /** Keyed by CheckInQuestion.id. */
  answers: Record<string, CheckInAnswer>;
  /** True when the child chose "I don't feel like it today". Counts as a valid check-in. */
  notToday: boolean;
  /** Optional short free text from the child, stored as typed. */
  childNote?: string;
  createdAt: string;
};
