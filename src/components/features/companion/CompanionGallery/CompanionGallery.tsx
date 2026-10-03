"use client";

import { Heading, Text } from "@/components/ui";
import { ITEM_IDS } from "@/config/content-ids";
import { Companion, type CompanionSize } from "../Companion/Companion";
import { COMPANION_POSES } from "../Companion/poses";
import {
  CompanionFrame,
  GalleryContainer,
  GalleryGrid,
  GalleryItemBox,
  GallerySection,
} from "./CompanionGallery.style";

const ALL_ITEMS = [
  ITEM_IDS.hatExplorer,
  ITEM_IDS.capeStar,
  ITEM_IDS.gadgetGoggles,
  ITEM_IDS.colorTeal,
];

const SIZES: readonly CompanionSize[] = ["sm", "md", "lg"];

export function CompanionGallery() {
  return (
    <GalleryContainer>
      <Heading level={1}>Companion Showcase Gallery</Heading>
      <Text tone="muted">
        Every companion pose rendered across sizes (sm, md, lg) both with default appearance and
        with equipped items.
      </Text>

      {COMPANION_POSES.map((pose) => (
        <GallerySection key={pose}>
          <Heading level={2}>Pose: {pose}</Heading>

          <Text tone="muted">Default appearance:</Text>
          <GalleryGrid>
            {SIZES.map((size) => (
              <GalleryItemBox key={`${pose}-default-${size}`}>
                <CompanionFrame>
                  <Companion pose={pose} size={size} />
                </CompanionFrame>
                <Text size="sm" tone="muted">
                  Size: {size}
                </Text>
              </GalleryItemBox>
            ))}
          </GalleryGrid>

          <Text tone="muted">With equipped items (hat, cape, goggles, teal):</Text>
          <GalleryGrid>
            {SIZES.map((size) => (
              <GalleryItemBox key={`${pose}-equipped-${size}`}>
                <CompanionFrame>
                  <Companion pose={pose} size={size} equippedItemIds={ALL_ITEMS} />
                </CompanionFrame>
                <Text size="sm" tone="muted">
                  Size: {size} (equipped)
                </Text>
              </GalleryItemBox>
            ))}
          </GalleryGrid>
        </GallerySection>
      ))}
    </GalleryContainer>
  );
}
