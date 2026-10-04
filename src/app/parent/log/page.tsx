import type { Metadata } from "next";
import { DailyLogScreen } from "@/components/features/parent-mode/DailyLog/DailyLogScreen";

export const metadata: Metadata = {
  title: "Daily log",
};

export default function ParentLogPage() {
  return <DailyLogScreen />;
}
