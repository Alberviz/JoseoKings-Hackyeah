import type { Metadata } from "next";
import { APP_NAME } from "@/config/app";
import { PatternsScreen } from "@/components/features/patterns/PatternsScreen/PatternsScreen";

export const metadata: Metadata = {
  title: `Patterns & Trends | ${APP_NAME}`,
  description: `Weekly patterns, colour calendar and food co-occurrences for ${APP_NAME} families.`,
};

export default function PatternsPage() {
  return <PatternsScreen />;
}
