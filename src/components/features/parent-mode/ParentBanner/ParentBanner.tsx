"use client";

import type { ReactNode } from "react";
import { Heading, Text } from "@/components/ui";
import { ParentNavIcon, type ParentNavIconKey } from "../ParentNav/ParentNavIcons";
import type { ParentSection } from "../sections";
import { BannerContainer, BannerText } from "./ParentBanner.style";

type ParentBannerProps = {
  section: ParentSection;
  icon: ParentNavIconKey;
  title: string;
  subtitle?: ReactNode;
  /** False on screens without the settings gear (Settings, PIN gate). */
  hasGear?: boolean;
};

// First element of every parent screen: the section colour, its drawn icon and the title.
export function ParentBanner({
  section,
  icon,
  title,
  subtitle,
  hasGear = true,
}: ParentBannerProps) {
  return (
    <BannerContainer $section={section} $hasGear={hasGear}>
      <ParentNavIcon iconKey={icon} size={34} />
      <BannerText>
        <Heading level={1}>{title}</Heading>
        {subtitle ? <Text size="sm">{subtitle}</Text> : null}
      </BannerText>
    </BannerContainer>
  );
}
