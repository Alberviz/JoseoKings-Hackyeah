import styled, { css, keyframes, type Keyframes } from "styled-components";
import { type JointAngles, type MoveKey, MOVE_DEFINITIONS, MOVE_KEYS } from "./poses";

export type JointKey =
  | "neck"
  | "torso"
  | "leftShoulder"
  | "rightShoulder"
  | "leftElbow"
  | "rightElbow"
  | "leftHip"
  | "rightHip"
  | "leftKnee"
  | "rightKnee";

export const JOINTS: readonly JointKey[] = [
  "neck",
  "torso",
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "rightElbow",
  "leftHip",
  "rightHip",
  "leftKnee",
  "rightKnee",
] as const;

export const jointOrigins: Record<JointKey, string> = {
  neck: "bottom center",
  torso: "bottom center",
  leftShoulder: "top center",
  rightShoulder: "top center",
  leftElbow: "top center",
  rightElbow: "top center",
  leftHip: "top center",
  rightHip: "top center",
  leftKnee: "top center",
  rightKnee: "top center",
};

function buildJointKeyframeCss(poses: JointAngles[], joint: keyof JointAngles): string {
  const count = poses.length;
  if (joint === "torso") {
    if (count === 2) {
      const p0 = poses[0];
      const p1 = poses[1];
      const r0 = p0.torso ?? 0;
      const r1 = p1.torso ?? 0;
      const y0 = p0.torsoY ?? 0;
      const y1 = p1.torsoY ?? 0;
      return `
        0%, 20% { transform: rotate(${r0}deg) translateY(${y0}px); }
        45%, 65% { transform: rotate(${r1}deg) translateY(${y1}px); }
        90%, 100% { transform: rotate(${r0}deg) translateY(${y0}px); }
      `;
    }
    if (count === 3) {
      const p0 = poses[0];
      const p1 = poses[1];
      const p2 = poses[2];
      const r0 = p0.torso ?? 0;
      const r1 = p1.torso ?? 0;
      const r2 = p2.torso ?? 0;
      const y0 = p0.torsoY ?? 0;
      const y1 = p1.torsoY ?? 0;
      const y2 = p2.torsoY ?? 0;
      return `
        0%, 18% { transform: rotate(${r0}deg) translateY(${y0}px); }
        33%, 51% { transform: rotate(${r1}deg) translateY(${y1}px); }
        66%, 84% { transform: rotate(${r2}deg) translateY(${y2}px); }
        100% { transform: rotate(${r0}deg) translateY(${y0}px); }
      `;
    }
    if (count === 4) {
      const p0 = poses[0];
      const p1 = poses[1];
      const p2 = poses[2];
      const p3 = poses[3];
      const r0 = p0.torso ?? 0;
      const r1 = p1.torso ?? 0;
      const r2 = p2.torso ?? 0;
      const r3 = p3.torso ?? 0;
      const y0 = p0.torsoY ?? 0;
      const y1 = p1.torsoY ?? 0;
      const y2 = p2.torsoY ?? 0;
      const y3 = p3.torsoY ?? 0;
      return `
        0%, 15% { transform: rotate(${r0}deg) translateY(${y0}px); }
        25%, 40% { transform: rotate(${r1}deg) translateY(${y1}px); }
        50%, 65% { transform: rotate(${r2}deg) translateY(${y2}px); }
        75%, 90% { transform: rotate(${r3}deg) translateY(${y3}px); }
        100% { transform: rotate(${r0}deg) translateY(${y0}px); }
      `;
    }
  }

  if (count === 2) {
    const v0 = poses[0][joint] ?? 0;
    const v1 = poses[1][joint] ?? 0;
    return `
      0%, 20% { transform: rotate(${v0}deg); }
      45%, 65% { transform: rotate(${v1}deg); }
      90%, 100% { transform: rotate(${v0}deg); }
    `;
  }
  if (count === 3) {
    const v0 = poses[0][joint] ?? 0;
    const v1 = poses[1][joint] ?? 0;
    const v2 = poses[2][joint] ?? 0;
    return `
      0%, 18% { transform: rotate(${v0}deg); }
      33%, 51% { transform: rotate(${v1}deg); }
      66%, 84% { transform: rotate(${v2}deg); }
      100% { transform: rotate(${v0}deg); }
    `;
  }
  if (count === 4) {
    const v0 = poses[0][joint] ?? 0;
    const v1 = poses[1][joint] ?? 0;
    const v2 = poses[2][joint] ?? 0;
    const v3 = poses[3][joint] ?? 0;
    return `
      0%, 15% { transform: rotate(${v0}deg); }
      25%, 40% { transform: rotate(${v1}deg); }
      50%, 65% { transform: rotate(${v2}deg); }
      75%, 90% { transform: rotate(${v3}deg); }
      100% { transform: rotate(${v0}deg); }
    `;
  }
  const v0 = poses[0]?.[joint] ?? 0;
  return `0%, 100% { transform: rotate(${v0}deg); }`;
}

// Pre-create keyframes for all moves and joints
const ANIMATIONS = {} as Record<MoveKey, Record<JointKey, Keyframes>>;
for (const move of MOVE_KEYS) {
  const def = MOVE_DEFINITIONS[move];
  ANIMATIONS[move] = {} as Record<JointKey, Keyframes>;
  for (const joint of JOINTS) {
    const kfCss = buildJointKeyframeCss(def.poses, joint);
    ANIMATIONS[move][joint] = keyframes`
      ${kfCss}
    `;
  }
}

function getJointAnimation(move: MoveKey, joint: JointKey) {
  const def = MOVE_DEFINITIONS[move];
  if (!def) {
    return "none";
  }
  const kf = ANIMATIONS[move]?.[joint];
  if (!kf) {
    return "none";
  }
  return css`
    ${kf} ${def.cycleSeconds}s ease-in-out infinite
  `;
}

function getInitialTransform(move: MoveKey, joint: JointKey) {
  const def = MOVE_DEFINITIONS[move];
  const pose0 = def?.poses[0];
  if (!pose0) {
    return "none";
  }
  if (joint === "torso") {
    const r = pose0.torso ?? 0;
    const y = pose0.torsoY ?? 0;
    return `rotate(${r}deg) translateY(${y}px)`;
  }
  const v = pose0[joint] ?? 0;
  return `rotate(${v}deg)`;
}

export const StyledFigureSvg = styled.svg.attrs<{
  $size: number;
  $withAdult: boolean;
  $reducedMotion: boolean;
}>(({ $reducedMotion }) => ({
  "data-reduced-motion": $reducedMotion ? "true" : "false",
  className: $reducedMotion ? "reduced-motion" : "",
}))<{
  $size: number;
  $withAdult: boolean;
  $reducedMotion: boolean;
}>`
  display: block;
  flex-shrink: 0;
  width: ${({ $size, $withAdult }) =>
    $withAdult ? `${Math.round($size * 1.33)}px` : `${$size}px`};
  height: ${({ $size }) => `${$size}px`};
  max-width: 100%;
  overflow: visible;

  @media (prefers-reduced-motion: reduce) {
    &,
    & * {
      animation: none !important;
    }
  }

  &[data-reduced-motion="true"],
  &.reduced-motion {
    &,
    & * {
      animation: none !important;
    }
  }
`;

export const SvgGroundLine = styled.line`
  stroke: ${({ theme }) => theme.colors.ink};
  stroke-width: 6px;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

export const SvgLimb = styled.line`
  stroke: ${({ theme }) => theme.colors.ink};
  stroke-width: 6px;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

export const SvgHead = styled.circle`
  stroke: ${({ theme }) => theme.colors.ink};
  stroke-width: 6px;
  fill: ${({ theme }) => theme.colors.surface};
`;

export const SvgFurniture = styled.line`
  stroke: ${({ theme }) => theme.colors.ink};
  stroke-width: 5px;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

export const FigureContainerG = styled.g``;

export const JointG = styled.g<{ $move: MoveKey; $joint: JointKey }>`
  transform-box: fill-box;
  transform-origin: ${({ $joint }) => jointOrigins[$joint]};
  transform: ${({ $move, $joint }) => getInitialTransform($move, $joint)};
  animation: ${({ $move, $joint }) => getJointAnimation($move, $joint)};

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`;
