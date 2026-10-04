import type { Metadata } from "next";
import { SetupScreen } from "@/components/features/parent-mode";

export const metadata: Metadata = {
  title: "Setup",
};

export default function ParentSetupPage() {
  return <SetupScreen />;
}
