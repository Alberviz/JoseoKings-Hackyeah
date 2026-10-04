import type { Metadata } from "next";
import { CompanionScreen } from "@/components/features/companion";

export const metadata: Metadata = {
  title: "Companion",
};

export default function CompanionPage() {
  return <CompanionScreen />;
}
