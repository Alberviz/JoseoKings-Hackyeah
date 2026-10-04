import type { Metadata } from "next";
import { CustomizeScreen } from "@/components/features/child-mode/CustomizeScreen";

export const metadata: Metadata = {
  title: "Customize",
};

export default function CustomizePage() {
  return <CustomizeScreen />;
}
