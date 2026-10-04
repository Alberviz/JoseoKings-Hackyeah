import type { ReactNode } from "react";
import { ParentNav } from "@/components/features/parent-mode/ParentNav/ParentNav";

export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ParentNav />
    </>
  );
}
