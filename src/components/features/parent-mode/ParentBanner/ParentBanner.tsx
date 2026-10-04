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
  /** Round stickers at the top right that the banner leaves room for: gear and exit (2), only exit (1, Settings), none (0, PIN gate). */
  stickers?: 0 | 1 | 2;
};

// First element of every parent screen: the section colour, its drawn icon and the title.
export function ParentBanner({ section, icon, title, subtitle, stickers = 2 }: ParentBannerProps) {
  return (
    <BannerContainer $section={section} $stickers={stickers}>
      <ParentNavIcon iconKey={icon} size={34} />
      <BannerText>
        <Heading level={1}>{title}</Heading>
        {subtitle ? <Text size="sm">{subtitle}</Text> : null}
      </BannerText>
    </BannerContainer>
  );
}
