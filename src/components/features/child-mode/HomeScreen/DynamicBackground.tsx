"use client";

import type { DragonStageId } from "@/types";
import {
  AuroraLayer,
  BackgroundContainer,
  CloudGroup,
  CloudItem,
  CloudSvg,
  EmberGroup,
  EmberItem,
  EmberSvg,
  SparkleGroup,
  SparkleItem,
  SparkleSvg,
  SvgCloudPath,
  SvgEmberCircle,
  SvgSparklePath,
} from "./DynamicBackground.style";

const CLOUD_PATH =
  "M 25 60 C 12 60 0 48 0 35 C 0 22 10 12 22 12 C 28 5 38 0 50 0 C 65 0 78 8 83 20 C 90 16 98 15 106 17 C 118 20 126 30 126 42 C 134 44 140 51 140 60 Z";

const SPARKLE_PATH =
  "M 12 0 C 12 7 7 12 0 12 C 7 12 12 17 12 24 C 12 17 17 12 24 12 C 17 12 12 7 12 0 Z";

// Staggered cloud layers at varied altitudes and gentle drift speeds (35s to 70s)
const CLOUD_CONFIGS = [
  { top: 5, scale: 0.9, durationSec: 46, delaySec: -12, opacity: 0.8 },
  { top: 16, scale: 1.25, durationSec: 36, delaySec: -30, opacity: 0.88 },
  { top: 32, scale: 0.75, durationSec: 58, delaySec: -4, opacity: 0.65 },
  { top: 52, scale: 1.1, durationSec: 42, delaySec: -24, opacity: 0.78 },
  { top: 70, scale: 0.85, durationSec: 64, delaySec: -45, opacity: 0.7 },
  { top: 84, scale: 1.05, durationSec: 48, delaySec: -18, opacity: 0.75 },
];

const SPARKLE_CONFIGS = [
  { top: 12, left: 15, size: 14, delaySec: 0 },
  { top: 22, left: 82, size: 18, delaySec: 1.5 },
  { top: 40, left: 24, size: 12, delaySec: 2.7 },
  { top: 65, left: 88, size: 16, delaySec: 0.8 },
  { top: 78, left: 10, size: 15, delaySec: 2.1 },
];

const EMBER_CONFIGS = [
  { bottom: 5, left: 18, size: 6, durationSec: 5.5, delaySec: 0 },
  { bottom: 12, left: 32, size: 8, durationSec: 4.8, delaySec: 1.2 },
  { bottom: 8, left: 65, size: 7, durationSec: 6.0, delaySec: 2.4 },
  { bottom: 15, left: 80, size: 5, durationSec: 4.2, delaySec: 0.5 },
  { bottom: 3, left: 48, size: 9, durationSec: 5.2, delaySec: 3.1 },
];

export interface DynamicBackgroundProps {
  stage: DragonStageId;
}

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
        >
          <CloudItem>
            <CloudSvg viewBox="0 0 140 60" preserveAspectRatio="none">
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
            $size={sparkle.size}
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
            $size={ember.size}
            $durationSec={ember.durationSec}
            $delaySec={ember.delaySec}
          >
            <EmberItem>
              <EmberSvg viewBox="0 0 10 10">
                <SvgEmberCircle cx="5" cy="5" r="4.5" />
              </EmberSvg>
            </EmberItem>
          </EmberGroup>
        ))}
    </BackgroundContainer>
  );
}
