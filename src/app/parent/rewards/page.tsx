import type { Metadata } from "next";
import { RewardsScreen } from "@/components/features/parent-mode/RewardsScreen/RewardsScreen";

export const metadata: Metadata = {
  title: "Rewards",
};

export default function ParentRewardsPage() {
  return <RewardsScreen />;
}
