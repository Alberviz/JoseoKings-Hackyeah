import type { Metadata } from "next";
import { PatternsScreen } from "@/components/features/patterns/PatternsScreen/PatternsScreen";

export const metadata: Metadata = {
  title: "Patterns & Trends | CrohnCare",
  description: "Weekly patterns, colour calendar and food co-occurrences for CrohnCare families.",
};

export default function PatternsPage() {
  return <PatternsScreen />;
}
