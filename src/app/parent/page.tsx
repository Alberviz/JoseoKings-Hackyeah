import type { Metadata } from "next";
import { ParentHomeScreen } from "@/components/features/parent-mode";

export const metadata: Metadata = {
  title: "Parent",
};

export default function ParentPage() {
  return <ParentHomeScreen />;
}
