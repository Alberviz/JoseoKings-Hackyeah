"use client";

import {
  AuroraLayer,
  BackgroundContainer,
  CloudGroup,
  CloudItem,
  CloudSvg,
  EmberGroup,
  EmberItem,
  SparkleGroup,
  SparkleItem,
  SvgCloudPath,
} from "./DynamicBackground.style";

const CLOUD_PATH_1 =
  "M 25 55 C 12 55 5 45 8 35 C 10 25 22 22 30 24 C 35 12 52 8 68 15 C 78 5 98 5 110 14 C 122 8 138 12 142 24 C 152 26 158 35 154 44 C 150 54 140 55 130 55 Z";

const CLOUD_PATH_2 =
  "M 30 58 C 16 58 6 48 10 36 C 14 26 26 24 34 26 C 40 14 58 10 74 16 C 86 6 108 6 122 15 C 134 10 150 14 154 26 C 164 30 170 40 165 50 C 160 58 146 58 136 58 Z";

const CLOUDS = [
  { top: 5, width: 140, duration: 52, delay: -14, opacity: 0.85, path: CLOUD_PATH_1 },
  { top: 16, width: 180, duration: 68, delay: -38, opacity: 0.95, path: CLOUD_PATH_2 },
  { top: 30, width: 120, duration: 46, delay: -8, opacity: 0.75, path: CLOUD_PATH_1 },
  { top: 50, width: 160, duration: 60, delay: -28, opacity: 0.8, path: CLOUD_PATH_2 },
  { top: 68, width: 190, duration: 74, delay: -50, opacity: 0.9, path: CLOUD_PATH_1 },
  { top: 82, width: 130, duration: 56, delay: -20, opacity: 0.7, path: CLOUD_PATH_2 },
] as const;

const STAGE_1_SPARKLES = [
  { top: 12, left: 18, size: 5, duration: 3.5, delay: 0, color: "rgba(180, 235, 245, 0.9)" },
  { top: 25, left: 82, size: 6, duration: 4.2, delay: 1.2, color: "rgba(255, 235, 200, 0.9)" },
  { top: 42, left: 12, size: 4, duration: 3.8, delay: 2.1, color: "rgba(220, 210, 255, 0.85)" },
  { top: 65, left: 88, size: 5, duration: 4.5, delay: 0.6, color: "rgba(186, 252, 225, 0.9)" },
  { top: 78, left: 24, size: 6, duration: 3.2, delay: 1.8, color: "rgba(255, 225, 235, 0.85)" },
] as const;

const STAGE_2_SPARKLES = [
  { top: 10, left: 22, size: 6, duration: 3.0, delay: 0, color: "rgba(255, 215, 120, 0.95)" },
  { top: 22, left: 78, size: 7, duration: 3.6, delay: 1.0, color: "rgba(255, 180, 110, 0.9)" },
  { top: 38, left: 15, size: 5, duration: 4.0, delay: 1.7, color: "rgba(255, 230, 150, 0.85)" },
  { top: 60, left: 85, size: 6, duration: 3.2, delay: 0.5, color: "rgba(255, 170, 90, 0.9)" },
  { top: 75, left: 30, size: 7, duration: 3.8, delay: 2.2, color: "rgba(255, 210, 130, 0.9)" },
] as const;

const STAGE_3_EMBERS = [
  { left: 15, size: 5, duration: 11, delay: 0 },
  { left: 35, size: 7, duration: 14, delay: 2.5 },
  { left: 55, size: 4, duration: 10, delay: 5.0 },
  { left: 72, size: 6, duration: 13, delay: 1.8 },
  { left: 88, size: 5, duration: 12, delay: 7.2 },
] as const;

export type DynamicBackgroundProps = {
  stage: 1 | 2 | 3;
};

export function DynamicBackground({ stage }: DynamicBackgroundProps) {
  const sparkles = stage === 1 ? STAGE_1_SPARKLES : stage === 2 ? STAGE_2_SPARKLES : null;

  return (
    <BackgroundContainer
      $stage={stage}
      aria-hidden="true"
      data-testid="dynamic-evolution-background"
    >
      {/* 1. Epic Aurora Layer for Stage 3 */}
      {stage === 3 && <AuroraLayer />}

      {/* 2. Gentle Floating Clouds (All Stages, themed colors) */}
      <CloudGroup>
        {CLOUDS.map((c, i) => (
          <CloudItem
            key={`cloud-${i}`}
            $topPercent={c.top}
            $scale={1}
            $durationSec={c.duration}
            $delaySec={c.delay}
            $opacity={c.opacity}
          >
            <CloudSvg $stage={stage} $width={c.width} viewBox="0 0 180 75">
              <SvgCloudPath $stage={stage} d={c.path} />
            </CloudSvg>
          </CloudItem>
        ))}
      </CloudGroup>

      {/* 3. Stage 1 & 2 Gentle Ambient Sparkles */}
      {sparkles && (
        <SparkleGroup>
          {sparkles.map((s, i) => (
            <SparkleItem
              key={`sparkle-${i}`}
              $top={s.top}
              $left={s.left}
              $size={s.size}
              $duration={s.duration}
              $delay={s.delay}
              $color={s.color}
            />
          ))}
        </SparkleGroup>
      )}

      {/* 4. Stage 3 Gentle Rising Fire Embers */}
      {stage === 3 && (
        <EmberGroup>
          {STAGE_3_EMBERS.map((e, i) => (
            <EmberItem
              key={`ember-${i}`}
              $left={e.left}
              $size={e.size}
              $duration={e.duration}
              $delay={e.delay}
            />
          ))}
        </EmberGroup>
      )}
    </BackgroundContainer>
  );
}
