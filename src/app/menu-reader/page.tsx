import type { Metadata } from "next";
import { MenuReaderScreen } from "@/components/features/menu-reader/MenuReaderScreen/MenuReaderScreen";

export const metadata: Metadata = {
  title: "Menu reader",
};

export default function MenuReaderPage() {
  return <MenuReaderScreen />;
}
