import type { Metadata } from "next";
import { FoodScreen } from "@/components/features/child-mode/FoodScreen";

export const metadata: Metadata = {
  title: "Food",
};

export default function FoodPage() {
  return <FoodScreen />;
}
