import type { Metadata } from "next";
import { SettingsScreen } from "@/components/features/parent-mode";

export const metadata: Metadata = {
  title: "Settings",
};

export default function ParentSettingsPage() {
  return <SettingsScreen />;
}
