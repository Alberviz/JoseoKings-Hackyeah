"use client";

import type { DragonStageId } from "@/types";
import {
  AuroraLayer,
  BackgroundContainer,
  CloudGroup,
  CloudHalo,
  CloudItem,
  CloudSvg,
  EmberGroup,
  EmberItem,
  SparkleGroup,
  SparkleItem,
  SparkleSvg,
  SvgCloudPath,
  SvgSparklePath,
} from "./DynamicBackground.style";

// The cloud outline touches x 0..140 and y 0..60. The viewBox adds room around it, so
// nothing painted outside the outline (the soft halo) is cut by the edge of the SVG box.
const CLOUD_PATH =
  "M 25 60 C 12 60 0 48 0 35 C 0 22 10 12 22 12 C 28 5 38 0 50 0 C 65 0 78 8 83 20 C 90 16 98 15 106 17 C 118 20 126 30 126 42 C 134 44 140 51 140 60 Z";
const CLOUD_VIEW_BOX = "-24 -24 188 108";

const SPARKLE_PATH =
  "M 12 0 C 12 7 7 12 0 12 C 7 12 12 17 12 24 C 12 17 17 12 24 12 C 17 12 12 7 12 0 Z";

// Staggered cloud layers at varied altitudes and gentle drift speeds (38s to 64s).
// `top` is a percentage of the viewport height and starts below the top HUD row.
// `restLeft` is where the cloud rests when the user prefers reduced motion.
const CLOUD_CONFIGS = [
  { top: 13, scale: 0.9, durationSec: 46, delaySec: -12, opacity: 0.8, restLeft: 62 },
  { top: 24, scale: 1.2, durationSec: 38, delaySec: -30, opacity: 0.86, restLeft: -6 },
  { top: 40, scale: 0.75, durationSec: 58, delaySec: -4, opacity: 0.65, restLeft: 70 },
  { top: 55, scale: 1.1, durationSec: 42, delaySec: -24, opacity: 0.78, restLeft: 40 },
  { top: 70, scale: 0.85, durationSec: 64, delaySec: -45, opacity: 0.7, restLeft: -8 },
  { top: 84, scale: 1.05, durationSec: 48, delaySec: -18, opacity: 0.75, restLeft: 58 },
];

// `scale` multiplies the viewport-based base size of the particle.
const SPARKLE_CONFIGS = [
  { top: 15, left: 14, scale: 0.8, delaySec: 0 },
  { top: 24, left: 80, scale: 1.1, delaySec: 1.5 },
  { top: 42, left: 22, scale: 0.7, delaySec: 2.7 },
  { top: 66, left: 84, scale: 1, delaySec: 0.8 },
  { top: 78, left: 10, scale: 0.9, delaySec: 2.1 },
];

const EMBER_CONFIGS = [
  { bottom: 5, left: 18, scale: 0.7, durationSec: 5.5, delaySec: 0 },
  { bottom: 12, left: 32, scale: 0.9, durationSec: 4.8, delaySec: 1.2 },
  { bottom: 8, left: 65, scale: 0.8, durationSec: 6.0, delaySec: 2.4 },
  { bottom: 15, left: 80, scale: 0.6, durationSec: 4.2, delaySec: 0.5 },
  { bottom: 3, left: 48, scale: 1, durationSec: 5.2, delaySec: 3.1 },
];

export type DynamicBackgroundProps = {
  stage: DragonStageId;
};

export function DynamicBackground({ stage }: DynamicBackgroundProps) {
  return (
    <BackgroundContainer $stage={stage} aria-hidden="true">
      {/* Stage 3 Exclusive: Aurora Borealis Waves */}
      {stage === 3 && <AuroraLayer />}

      {/* Gentle Floating Clouds across all stages */}
      {CLOUD_CONFIGS.map((cloud, idx) => (
        <CloudGroup
          key={`cloud-${idx}`}
          $top={cloud.top}
          $scale={cloud.scale}
          $durationSec={cloud.durationSec}
          $delaySec={cloud.delaySec}
          $opacity={cloud.opacity}
          $restLeft={cloud.restLeft}
        >
          <CloudItem>
            <CloudSvg viewBox={CLOUD_VIEW_BOX}>
              <CloudHalo d={CLOUD_PATH} $stage={stage} />
              <SvgCloudPath d={CLOUD_PATH} $stage={stage} />
            </CloudSvg>
          </CloudItem>
        </CloudGroup>
      ))}

      {/* Stage 1 & 2: Soft Light Sparkles */}
      {stage !== 3 &&
        SPARKLE_CONFIGS.map((sparkle, idx) => (
          <SparkleGroup
            key={`sparkle-${idx}`}
            $top={sparkle.top}
            $left={sparkle.left}
            $scale={sparkle.scale}
            $delaySec={sparkle.delaySec}
          >
            <SparkleItem>
              <SparkleSvg viewBox="0 0 24 24">
                <SvgSparklePath d={SPARKLE_PATH} $stage={stage} />
              </SparkleSvg>
            </SparkleItem>
          </SparkleGroup>
        ))}

      {/* Stage 3: Warrior Rising Fire Embers */}
      {stage === 3 &&
        EMBER_CONFIGS.map((ember, idx) => (
          <EmberGroup
            key={`ember-${idx}`}
            $bottom={ember.bottom}
            $left={ember.left}
            $scale={ember.scale}
            $durationSec={ember.durationSec}
            $delaySec={ember.delaySec}
          >
            <EmberItem />
          </EmberGroup>
        ))}
    </BackgroundContainer>
  );
}
