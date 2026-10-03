import type { Metadata } from "next";
import { FoodDiaryScreen } from "@/components/features/parent-mode";

export const metadata: Metadata = {
  title: "Food Diary | CrohnCare",
  description:
    "Reactive food diary for parents to note meals and snacks to discuss with the care team.",
};

export default function FoodDiaryPage() {
  return <FoodDiaryScreen />;
}
