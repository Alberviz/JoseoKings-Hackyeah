"use client";

import type { ReactNode } from "react";
import { Heading } from "@/components/ui";
import type { ParentSection } from "../sections";
import { SectionCardBody, SectionCardContainer, SectionCardHeader } from "./SectionCard.style";

type SectionCardProps = {
  section: ParentSection;
  title: string;
  children: ReactNode;
  /** Accessible name when it must differ from the visible title. */
  label?: string;
};

// Parent-area card: ink outline and shadow, with a header strip in the section colour.
export function SectionCard({ section, title, children, label }: SectionCardProps) {
  return (
    <SectionCardContainer aria-label={label ?? title}>
      <SectionCardHeader $section={section}>
        <Heading level={2}>{title}</Heading>
      </SectionCardHeader>
      <SectionCardBody>{children}</SectionCardBody>
    </SectionCardContainer>
  );
}
