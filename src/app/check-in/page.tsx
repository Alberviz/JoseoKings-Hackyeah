import type { Metadata } from "next";
import { CheckInScreen } from "@/components/features/child-mode/CheckInScreen";

export const metadata: Metadata = {
  title: "Check-in",
};

export default function CheckInPage() {
  return <CheckInScreen />;
}
