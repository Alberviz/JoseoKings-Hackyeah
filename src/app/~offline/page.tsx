import type { Metadata } from "next";
import { OfflineScreen } from "@/components/features/offline/OfflineScreen/OfflineScreen";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return <OfflineScreen />;
}
