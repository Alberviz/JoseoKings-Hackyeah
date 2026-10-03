import type { MissionCompany } from "@/types";

/**
 * Neutral label for how a mission was done, shown to parents and in the doctor report.
 * About how the record was made, never about trust. Wording from docs/PRODUCT.md section 5.3.
 */
export const CONFIDENCE_LABELS: Record<MissionCompany, string> = {
  alone: "Done on their own",
  other: "Done with someone",
  family: "Done with family",
};

export const confidenceLabel = (company: MissionCompany): string => CONFIDENCE_LABELS[company];
