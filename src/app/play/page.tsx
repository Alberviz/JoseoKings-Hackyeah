import type { Metadata } from "next";
import { PlayFlow } from "@/components/features/child-mode/PlayFlow";

export const metadata: Metadata = {
  title: "Play",
};

export default function PlayPage() {
  return <PlayFlow />;
}
