"use client";

import { useSyncExternalStore } from "react";
import { type MoveKey, MOVE_KEYS } from "./poses";
import {
  FigureContainerG,
  JointG,
  StyledFigureSvg,
  SvgFurniture,
  SvgGroundLine,
  SvgHead,
  SvgLimb,
} from "./ExerciseFigure.style";

export type ExerciseFigureProps = {
  move: MoveKey;
  withAdult?: boolean;
  size?: number;
  label: string;
  reducedMotion?: boolean;
};

const VALID_MOVES = new Set<MoveKey>(MOVE_KEYS);

type FigureProps = {
  cx: number;
  scale: "child" | "adult";
  move: MoveKey;
  testId: string;
};

function StickFigure({ cx, scale, move, testId }: FigureProps) {
  const isAdult = scale === "adult";

  if (move === "cat-cow") {
    const kx = isAdult ? cx - 38 : cx - 28;
    const fx = isAdult ? cx - 56 : cx - 42;
    const hx = isAdult ? cx + 38 : cx + 28;
    const hipY = isAdult ? 148 : 162;
    const shoulderY = isAdult ? 148 : 162;
    const headCx = isAdult ? cx + 60 : cx + 44;
    const headCy = isAdult ? 148 : 162;
    const headR = isAdult ? 18 : 13;

    return (
      <FigureContainerG data-testid={testId}>
        {/* Planted back feet and knees */}
        <SvgLimb x1={fx} y1={210} x2={kx} y2={210} />
        <SvgLimb x1={kx} y1={210} x2={kx} y2={hipY} />
        {/* Planted arms and hands */}
        <SvgLimb x1={hx} y1={210} x2={hx} y2={shoulderY} />
        {/* Dynamic spine / torso */}
        <JointG $move={move} $joint="torso">
          <SvgLimb x1={kx} y1={hipY} x2={hx} y2={shoulderY} />
        </JointG>
        {/* Dynamic neck / head */}
        <JointG $move={move} $joint="neck">
          <SvgHead cx={headCx} cy={headCy} r={headR} />
        </JointG>
      </FigureContainerG>
    );
  }

  if (move === "tap-seated") {
    const hipY = isAdult ? 140 : 160;
    const neckY = isAdult ? 82 : 118;
    const headCy = isAdult ? 56 : 99;
    const headR = isAdult ? 18 : 13;
    const kneeX = isAdult ? cx + 36 : cx + 26;
    const seatLeft = isAdult ? cx - 24 : cx - 18;
    const seatRight = isAdult ? cx + 18 : cx + 14;
    const leg1X = isAdult ? cx - 18 : cx - 14;
    const leg2X = isAdult ? cx + 14 : cx + 10;
    const restHandX = isAdult ? cx + 22 : cx + 16;

    return (
      <FigureContainerG data-testid={testId}>
        {/* Stool */}
        <SvgFurniture x1={seatLeft} y1={hipY + 2} x2={seatRight} y2={hipY + 2} />
        <SvgFurniture x1={leg1X} y1={hipY + 2} x2={leg1X} y2={210} />
        <SvgFurniture x1={leg2X} y1={hipY + 2} x2={leg2X} y2={210} />

        {/* Torso & Head */}
        <JointG $move={move} $joint="torso">
          <SvgLimb x1={cx} y1={neckY} x2={cx} y2={hipY} />
        </JointG>
        <JointG $move={move} $joint="neck">
          <SvgHead cx={cx} cy={headCy} r={headR} />
        </JointG>

        {/* Resting Arms */}
        <SvgLimb x1={cx} y1={neckY + 6} x2={restHandX} y2={hipY} />

        {/* Horizontal Thighs */}
        <SvgLimb x1={cx} y1={hipY} x2={kneeX} y2={hipY} />

        {/* Tapping Left Shin */}
        <JointG $move={move} $joint="leftKnee">
          <SvgLimb x1={kneeX - 2} y1={hipY} x2={kneeX - 2} y2={210} />
        </JointG>

        {/* Tapping Right Shin */}
        <JointG $move={move} $joint="rightKnee">
          <SvgLimb x1={kneeX + 4} y1={hipY} x2={kneeX + 4} y2={210} />
        </JointG>
      </FigureContainerG>
    );
  }

  // Standard Standing Posture
  const headCy = isAdult ? 48 : 93;
  const headR = isAdult ? 18 : 13;
  const neckY = isAdult ? 74 : 112;
  const hipY = isAdult ? 134 : 156;
  const shoulderOffset = isAdult ? 16 : 12;
  const hipOffset = isAdult ? 14 : 10;
  const upperArmLen = isAdult ? 34 : 24;
  const forearmLen = isAdult ? 30 : 22;
  const thighLen = isAdult ? 38 : 27;
  const shinLen = isAdult ? 38 : 27;

  const leftShoulderX = cx - shoulderOffset;
  const rightShoulderX = cx + shoulderOffset;
  const leftHipX = cx - hipOffset;
  const rightHipX = cx + hipOffset;

  const elbowY = neckY + upperArmLen;
  const handY = elbowY + forearmLen;
  const kneeY = hipY + thighLen;
  const footY = kneeY + shinLen;

  return (
    <FigureContainerG data-testid={testId}>
      {/* Torso & Head */}
      <JointG $move={move} $joint="torso">
        <SvgLimb x1={cx} y1={neckY} x2={cx} y2={hipY} />
        <SvgLimb x1={leftShoulderX} y1={neckY} x2={rightShoulderX} y2={neckY} />
        <SvgLimb x1={leftHipX} y1={hipY} x2={rightHipX} y2={hipY} />
      </JointG>

      <JointG $move={move} $joint="neck">
        <SvgHead cx={cx} cy={headCy} r={headR} />
      </JointG>

      {/* Left Arm: Shoulder and Elbow */}
      <JointG $move={move} $joint="leftShoulder">
        <SvgLimb x1={leftShoulderX} y1={neckY} x2={leftShoulderX} y2={elbowY} />
        <JointG $move={move} $joint="leftElbow">
          <SvgLimb x1={leftShoulderX} y1={elbowY} x2={leftShoulderX} y2={handY} />
        </JointG>
      </JointG>

      {/* Right Arm: Shoulder and Elbow */}
      <JointG $move={move} $joint="rightShoulder">
        <SvgLimb x1={rightShoulderX} y1={neckY} x2={rightShoulderX} y2={elbowY} />
        <JointG $move={move} $joint="rightElbow">
          <SvgLimb x1={rightShoulderX} y1={elbowY} x2={rightShoulderX} y2={handY} />
        </JointG>
      </JointG>

      {/* Left Leg: Hip and Knee */}
      <JointG $move={move} $joint="leftHip">
        <SvgLimb x1={leftHipX} y1={hipY} x2={leftHipX} y2={kneeY} />
        <JointG $move={move} $joint="leftKnee">
          <SvgLimb x1={leftHipX} y1={kneeY} x2={leftHipX} y2={footY} />
        </JointG>
      </JointG>

      {/* Right Leg: Hip and Knee */}
      <JointG $move={move} $joint="rightHip">
        <SvgLimb x1={rightHipX} y1={hipY} x2={rightHipX} y2={kneeY} />
        <JointG $move={move} $joint="rightKnee">
          <SvgLimb x1={rightHipX} y1={kneeY} x2={rightHipX} y2={footY} />
        </JointG>
      </JointG>
    </FigureContainerG>
  );
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener?.("change", callback);
  return () => mq.removeEventListener?.("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function ExerciseFigure({
  move,
  withAdult = false,
  size = 240,
  label,
  reducedMotion,
}: ExerciseFigureProps) {
  const systemReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  if (!VALID_MOVES.has(move)) {
    return null;
  }

  const isReducedMotion = reducedMotion !== undefined ? reducedMotion : systemReducedMotion;
  const viewBox = withAdult ? "0 0 320 240" : "0 0 240 240";
  const groundX2 = withAdult ? 305 : 225;

  return (
    <StyledFigureSvg
      viewBox={viewBox}
      $size={size}
      $withAdult={withAdult}
      $reducedMotion={isReducedMotion}
      role="img"
      aria-label={label}
      data-testid="exercise-figure-svg"
      data-reduced-motion={isReducedMotion ? "true" : "false"}
    >
      {/* Ground line so planted feet never slide */}
      <SvgGroundLine x1={15} y1={210} x2={groundX2} y2={210} data-testid="ground-line" />

      {/* Second taller adult figure beside child if withAdult */}
      {withAdult && <StickFigure cx={90} scale="adult" move={move} testId="figure-adult" />}

      {/* Main child stick figure */}
      <StickFigure cx={withAdult ? 220 : 120} scale="child" move={move} testId="figure-child" />
    </StyledFigureSvg>
  );
}
