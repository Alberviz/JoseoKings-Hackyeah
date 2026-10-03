import type { Metadata } from "next";
import { RestroomMapScreen } from "@/components/features/restroom-map/RestroomMapScreen/RestroomMapScreen";

export const metadata: Metadata = {
  title: "Nearest restrooms",
};

export default function RestroomMapPage() {
  return <RestroomMapScreen />;
}
