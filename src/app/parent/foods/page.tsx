import type { Metadata } from "next";
import { APP_NAME } from "@/config/app";
import { FoodDiaryScreen } from "@/components/features/parent-mode";

export const metadata: Metadata = {
  title: `Food Diary | ${APP_NAME}`,
  description:
    "Reactive food diary for parents to note meals and snacks to discuss with the care team.",
};

export default function FoodDiaryPage() {
  return <FoodDiaryScreen />;
}
