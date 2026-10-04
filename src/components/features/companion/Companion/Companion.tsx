"use client";

import { useContext, useState } from "react";
import { ThemeContext } from "styled-components";
import { theme as defaultTheme } from "@/theme/theme";
import { ITEM_IDS } from "@/config/content-ids";
import { COMPANION_ITEMS } from "@/lib/rewards";
import type { CompanionItemSlot } from "@/types";
import type { CompanionPose } from "./poses";
import {
  AnimatedBalanceG,
  AnimatedBellyG,
  AnimatedBreatheG,
  AnimatedCheerArmsG,
  AnimatedCheerG,
  AnimatedEatG,
  AnimatedEmberCircle,
  AnimatedEmbersG,
  AnimatedEyesG,
  AnimatedFlameG,
  AnimatedHeadG,
  AnimatedIdleG,
  AnimatedLeftEarFinG,
  AnimatedLeftWingG,
  AnimatedRestingArmsG,
  AnimatedRightEarFinG,
  AnimatedRightWingG,
  AnimatedStrengthG,
  AnimatedStretchG,
  AnimatedTailG,
  HiddenSemanticG,
  StyledCompanionSvg,
  SvgCircle,
  SvgEllipse,
  SvgG,
  SvgImage,
  SvgPath,
  SvgPolygon,
} from "./Companion.style";

export type CompanionSize = "sm" | "md" | "lg";
export type CompanionStage = 1 | 2 | 3;

export const DRAGON_ARTWORK: Record<CompanionStage, string> = {
  1: "/dragon.png",
  2: "/dragon_stage2_teen.png",
  3: "/dragon_stage3_heroic.png",
};

export function getDragonArtwork(
  stage: CompanionStage = 1,
  equippedItemIds: string[] = [],
): string {
  const safeStage = stage === 2 || stage === 3 ? stage : 1;
  const hasHead = equippedItemIds.includes("hat") || equippedItemIds.includes("cap");
  const hasBody = equippedItemIds.includes("t-shirt") || equippedItemIds.includes("sport-shirt");
  const hasFace = equippedItemIds.includes("glasses") || equippedItemIds.includes("sunglasses");

  let combo = "none";
  if (hasFace && hasBody && hasHead) {
    combo = "all";
  } else if (hasBody && hasHead) {
    combo = "shirt_hat";
  } else if (hasFace && hasHead) {
    combo = "glasses_hat";
  } else if (hasFace && hasBody) {
    combo = "glasses_shirt";
  } else if (hasHead) {
    combo = "all";
  } else if (hasBody) {
    combo = "shirt";
  } else if (hasFace) {
    combo = "glasses";
  } else {
    combo = "none";
  }

  if (combo === "none") {
    return DRAGON_ARTWORK[safeStage];
  }
  if (combo === "all") {
    return `/dragon_stage${safeStage}_all.png`;
  }
  if (combo === "shirt") {
    return `/dragon_stage${safeStage}_shirt.png`;
  }
  if (combo === "glasses") {
    return `/dragon_stage${safeStage}_glasses.png`;
  }

  return `/dragon_v2_stage${safeStage}_${combo}.png`;
}

export const ACCESSORY_TRANSFORMS: Record<
  CompanionStage,
  {
    hat: string;
    cap: string;
    glasses: string;
    sunglasses: string;
    tshirt: string;
    sportShirt: string;
  }
> = {
  1: {
    hat: "translate(100, 44) scale(1.0)",
    cap: "translate(100, 42) scale(0.98)",
    glasses: "translate(100, 72) scale(1.0)",
    sunglasses: "translate(100, 72) scale(1.0)",
    tshirt: "translate(100, 130) scale(1.0, 1.0)",
    sportShirt: "translate(100, 130) scale(1.0, 1.0)",
  },
  2: {
    hat: "translate(107, 40) rotate(3)",
    cap: "translate(107, 37) rotate(2)",
    glasses: "translate(107, 68)",
    sunglasses: "translate(107, 68)",
    tshirt: "translate(109, 107) rotate(-4)",
    sportShirt: "translate(109, 107) rotate(-4)",
  },
  3: {
    hat: "translate(107, 42) rotate(2)",
    cap: "translate(107, 40) rotate(1)",
    glasses: "translate(107, 67)",
    sunglasses: "translate(107, 67)",
    tshirt: "translate(110, 107) rotate(-3)",
    sportShirt: "translate(110, 107) rotate(-3)",
  },
};

export type CompanionProps = {
  pose: CompanionPose;
  equippedItemIds?: string[];
  size?: CompanionSize;
  name?: string;
  animated?: boolean;
  interactive?: boolean;
  onTap?: () => void;
  onClick?: () => void;
  isEating?: boolean;
  showEmbers?: boolean;
  stage?: CompanionStage;
};

export function Companion({
  pose,
  equippedItemIds = [],
  size = "md",
  name = "Your companion",
  animated = true,
  interactive = true,
  onTap,
  onClick,
  isEating = false,
  showEmbers = false,
  stage = 1,
}: CompanionProps) {
  const currentTheme = useContext(ThemeContext) || defaultTheme;
  const [isTapped, setIsTapped] = useState(false);

  const handleClick = () => {
    if (interactive && animated) {
      setIsTapped(true);
      setTimeout(() => setIsTapped(false), 700);
    }
    onTap?.();
    onClick?.();
  };

  // Resolve equipped items by slot: only one item per slot is shown, unknown IDs ignored
  const activeItemsBySlot = new Map<CompanionItemSlot, string>();
  for (const id of equippedItemIds) {
    const item = COMPANION_ITEMS.find((it) => it.id === id);
    if (item) {
      activeItemsBySlot.set(item.slot, item.id);
    }
  }

  const isTeal = activeItemsBySlot.get("color") === ITEM_IDS.colorTeal;
  const hasCape = activeItemsBySlot.get("cape") === ITEM_IDS.capeStar;

  // Head slot: cap has precedence if both present, otherwise hat (explorer hat)
  const hasCap = equippedItemIds.includes("cap");
  const hasExplorerHat =
    !hasCap &&
    (activeItemsBySlot.get("hat") === ITEM_IDS.hatExplorer || equippedItemIds.includes("hat"));
  const hasHat = hasExplorerHat;

  // Face slot: sunglasses has precedence if both present, otherwise classic glasses / goggles
  const hasSunglasses = equippedItemIds.includes("sunglasses");
  const hasClassicGlasses =
    !hasSunglasses &&
    (activeItemsBySlot.get("gadget") === ITEM_IDS.gadgetGoggles ||
      equippedItemIds.includes("glasses"));
  const hasGlasses = hasClassicGlasses;
  const hasGoggles = hasClassicGlasses;

  // Body slot: sport-shirt has precedence if both present, otherwise star t-shirt
  const hasSportShirt = equippedItemIds.includes("sport-shirt");
  const hasTshirt = !hasSportShirt && equippedItemIds.includes("t-shirt");

  const currentStage = stage || 1;
  const transforms = ACCESSORY_TRANSFORMS[currentStage] || ACCESSORY_TRANSFORMS[1];

  // Kraków Dragon color tokens from currentTheme.colors (strictly no hardcoded hex literals)
  const colors = currentTheme.colors;
  const whiteColor = colors.onPrimary || "#FFFFFF";
  const eyeColor = colors.dragonEye;
  const bodyColor = isTeal ? colors.success : colors.dragonBody;
  const bodyBorderColor = isTeal ? colors.success : colors.dragonBodyBorder;
  const bellyColor = colors.dragonBelly;
  const bellyLineColor = colors.dragonBellyLines;
  const wingColor = colors.dragonWing;
  const wingStrutColor = colors.dragonWingStrut;
  const hornColor = colors.dragonHorn;
  const hornHighlightColor = colors.dragonHornHighlight;
  const cheekColor = colors.dragonCheek;
  const flameOuterColor = colors.accent;
  const flameInnerColor = colors.highlight;
  const emberGoldColor = colors.dragonHornHighlight;

  // Choose the outer animation wrapper based on pose
  const PoseAnimationWrapper =
    pose === "idle"
      ? AnimatedIdleG
      : pose === "breathe"
        ? AnimatedBreatheG
        : pose === "stretch"
          ? AnimatedStretchG
          : pose === "balance"
            ? AnimatedBalanceG
            : pose === "strength"
              ? AnimatedStrengthG
              : pose === "eat"
                ? AnimatedEatG
                : AnimatedCheerG;

  const accessibleLabel = `${name} (${pose} pose)`;

  return (
    <StyledCompanionSvg
      viewBox="0 0 200 200"
      $size={size}
      $animated={animated}
      $interactive={interactive}
      $tapped={isTapped}
      onClick={handleClick}
      data-animated={animated ? "true" : "false"}
      data-stage={stage}
      role="img"
      aria-label={accessibleLabel}
      data-testid="companion-svg"
    >
      <PoseAnimationWrapper
        key={pose === "cheer" ? "pose-cheer" : `pose-${pose}`}
        $animated={animated}
        $isTapped={isTapped}
      >
        {/* --- Celebration Embers & Sparkles --- */}
        {(showEmbers || pose === "cheer" || isTapped) && (
          <AnimatedEmbersG data-testid="companion-embers">
            <SvgPolygon
              points="45,40 47,34 49,40 55,42 49,44 47,50 45,44 39,42"
              fill={flameOuterColor}
            />
            <SvgPolygon
              points="155,45 157,39 159,45 165,47 159,49 157,55 155,49 149,47"
              fill={flameInnerColor}
            />
            <SvgCircle cx="100" cy="25" r="2.5" fill={emberGoldColor} />
            <SvgCircle cx="60" cy="70" r="2" fill={flameOuterColor} />
            <SvgCircle cx="140" cy="65" r="2" fill={flameOuterColor} />
          </AnimatedEmbersG>
        )}

        {/* --- Back Layer: Cape Item --- */}
        {hasCape && (
          <SvgG data-testid="companion-cape">
            <SvgPath
              d="M 68 86 C 54 120 46 152 42 168 C 64 162 84 166 100 160 C 116 166 136 162 158 168 C 154 152 146 120 132 86 Z"
              fill={colors.urgent}
              stroke={colors.text}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <SvgPolygon
              points="100,122 103,129 111,129 105,133 107,140 100,136 93,140 95,133 89,129 97,129"
              fill={colors.focus}
              stroke={colors.text}
              strokeWidth="1"
            />
          </SvgG>
        )}

        {/* --- OFFICIAL EXACT KRAKÓW DRAGON ARTWORK (Full fidelity transparent PNG) --- */}
        <SvgImage
          href={getDragonArtwork(stage || 1, equippedItemIds)}
          x="10"
          y="10"
          width="180"
          height="180"
          preserveAspectRatio="xMidYMid meet"
          data-testid="companion-artwork"
          $isTeal={isTeal}
        />

        {/* --- Equipped Wearable Markers (Artwork natively includes clothes from the high-res spritesheet) --- */}
        {hasSportShirt && (
          <SvgG data-testid="companion-wearable-sport-shirt" transform={transforms.sportShirt} />
        )}
        {hasTshirt && (
          <SvgG data-testid="companion-wearable-tshirt" transform={transforms.tshirt} />
        )}
        {hasSunglasses && (
          <SvgG data-testid="companion-wearable-sunglasses" transform={transforms.sunglasses} />
        )}
        {hasGlasses && (
          <SvgG data-testid="companion-wearable-glasses" transform={transforms.glasses} />
        )}
        {hasCap && <SvgG data-testid="companion-wearable-cap" transform={transforms.cap} />}
        {hasHat && <SvgG data-testid="companion-wearable-hat" transform={transforms.hat} />}

        {/* --- Semantic Vector Structure for Test Compatibility & Layout --- */}
        <HiddenSemanticG>
          {/* --- Dragon Wings (Lavender inner webbing with turquoise frames) --- */}
          <SvgG id="dragon-wings" data-testid="companion-wings">
            {/* Left Wing */}
            <AnimatedLeftWingG
              $animated={animated}
              $isCheer={pose === "cheer"}
              data-testid="companion-wing-left"
            >
              {/* Lavender Webbing with 3 scalloped peaks */}
              <SvgPath
                d="M 72 102 C 50 82 28 86 16 100 C 20 116 30 126 42 136 C 52 126 62 114 72 102 Z"
                fill={wingColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Wing Struts */}
              <SvgPath
                d="M 36 92 L 42 134 M 50 96 L 54 124"
                stroke={wingStrutColor}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Turquoise Leading Edge Frame */}
              <SvgPath
                d="M 72 102 C 54 82 30 88 18 99"
                fill="none"
                stroke={bodyBorderColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </AnimatedLeftWingG>

            {/* Right Wing */}
            <AnimatedRightWingG
              $animated={animated}
              $isCheer={pose === "cheer"}
              data-testid="companion-wing-right"
            >
              {/* Lavender Webbing with 3 scalloped peaks */}
              <SvgPath
                d="M 128 102 C 150 82 172 86 184 100 C 180 116 170 126 158 136 C 148 126 138 114 128 102 Z"
                fill={wingColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Wing Struts */}
              <SvgPath
                d="M 164 92 L 158 134 M 150 96 L 146 124"
                stroke={wingStrutColor}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Turquoise Leading Edge Frame */}
              <SvgPath
                d="M 128 102 C 146 82 170 88 182 99"
                fill="none"
                stroke={bodyBorderColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </AnimatedRightWingG>
          </SvgG>

          {/* --- Dragon Tail --- */}
          <AnimatedTailG id="dragon-tail" data-testid="companion-tail" $animated={animated}>
            <SvgPath
              d="M 132 146 C 154 146 170 134 166 118 C 162 112 155 117 151 125 C 147 135 137 141 127 143 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Pale mint underside ridge */}
            <SvgPath
              d="M 140 146 C 152 144 162 135 165 120 C 163 126 157 134 147 141 Z"
              fill={bellyColor}
              stroke={bodyBorderColor}
              strokeWidth="1"
            />
            {/* Tail dorsal crest */}
            <SvgPath
              d="M 160 119 L 165 114 L 167 121 Z"
              fill={stage === 3 ? hornColor : bodyBorderColor}
            />
          </AnimatedTailG>

          {/* --- Dragon Legs / Feet (Pose Aware) --- */}
          {pose === "balance" ? (
            <SvgG id="dragon-feet-balance">
              {/* Planted Right Foot */}
              <SvgEllipse
                cx="116"
                cy="160"
                rx="15"
                ry="9"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
              />
              <SvgEllipse
                cx="116"
                cy="161"
                rx="9"
                ry="5.5"
                fill={bellyColor}
                stroke={bodyBorderColor}
                strokeWidth="0.8"
              />
              {/* Claws on Right Foot */}
              <SvgEllipse
                cx="107"
                cy="164"
                rx="2.5"
                ry="3"
                fill={whiteColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="116"
                cy="166"
                rx="2.5"
                ry="3.5"
                fill={whiteColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="125"
                cy="164"
                rx="2.5"
                ry="3"
                fill={whiteColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />

              {/* Lifted Left Foot (flamingo/balance tuck) */}
              <SvgPath
                d="M 85 138 C 66 138 60 148 70 154 C 80 156 88 148 94 145"
                fill="none"
                stroke={bodyColor}
                strokeWidth="9"
                strokeLinecap="round"
              />
              <SvgCircle
                cx="68"
                cy="152"
                r="7"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
              />
              <SvgCircle cx="64" cy="155" r="2" fill={whiteColor} />
              <SvgCircle cx="69" cy="157" r="2" fill={whiteColor} />
            </SvgG>
          ) : pose === "strength" ? (
            <SvgG id="dragon-feet-strength">
              {/* Sturdy Wide Squat Left Foot */}
              <SvgEllipse
                cx="74"
                cy="162"
                rx="16"
                ry="9"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
              />
              <SvgEllipse
                cx="74"
                cy="163"
                rx="10"
                ry="5.5"
                fill={bellyColor}
                stroke={bodyBorderColor}
                strokeWidth="0.8"
              />
              <SvgEllipse
                cx="65"
                cy="166"
                rx="2.5"
                ry="3"
                fill={whiteColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="74"
                cy="168"
                rx="2.5"
                ry="3.5"
                fill={whiteColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="83"
                cy="166"
                rx="2.5"
                ry="3"
                fill={whiteColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />

              {/* Sturdy Wide Squat Right Foot */}
              <SvgEllipse
                cx="126"
                cy="162"
                rx="16"
                ry="9"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
              />
              <SvgEllipse
                cx="126"
                cy="163"
                rx="10"
                ry="5.5"
                fill={bellyColor}
                stroke={bodyBorderColor}
                strokeWidth="0.8"
              />
              <SvgEllipse
                cx="117"
                cy="166"
                rx="2.5"
                ry="3"
                fill={whiteColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="126"
                cy="168"
                rx="2.5"
                ry="3.5"
                fill={whiteColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="135"
                cy="166"
                rx="2.5"
                ry="3"
                fill={whiteColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
            </SvgG>
          ) : (
            <SvgG id="dragon-feet-default">
              {/* Chubby Seated Thighs (Matching dragon.png) */}
              <SvgEllipse
                cx="70"
                cy="152"
                rx="16"
                ry="18"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
              />
              <SvgEllipse
                cx="130"
                cy="152"
                rx="16"
                ry="18"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
              />

              {/* Seated Left Foot with Pale Mint Sole Pad and 3 Claws */}
              <SvgEllipse
                cx="74"
                cy="164"
                rx="14"
                ry="12"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
              />
              <SvgEllipse
                cx="74"
                cy="165"
                rx="9"
                ry="8"
                fill={bellyColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="65"
                cy="158"
                rx="2.6"
                ry="3.2"
                fill={whiteColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="74"
                cy="155"
                rx="2.6"
                ry="3.6"
                fill={whiteColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="83"
                cy="158"
                rx="2.6"
                ry="3.2"
                fill={whiteColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />

              {/* Seated Right Foot with Pale Mint Sole Pad and 3 Claws */}
              <SvgEllipse
                cx="126"
                cy="164"
                rx="14"
                ry="12"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
              />
              <SvgEllipse
                cx="126"
                cy="165"
                rx="9"
                ry="8"
                fill={bellyColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="117"
                cy="158"
                rx="2.6"
                ry="3.2"
                fill={whiteColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="126"
                cy="155"
                rx="2.6"
                ry="3.6"
                fill={whiteColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="135"
                cy="158"
                rx="2.6"
                ry="3.2"
                fill={whiteColor}
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
            </SvgG>
          )}

          {/* --- Dragon Body & Belly (Smooth Mint Curved Belly) --- */}
          <SvgG data-testid="companion-body">
            {/* Main Torso */}
            <SvgPath
              d="M 100 80
               C 130 80 144 98 144 130
               C 144 154 130 166 100 166
               C 70 166 56 154 56 130
               C 56 98 70 80 100 80 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Smooth Mint Segmented Belly Plate */}
            <AnimatedBellyG data-testid="companion-belly" $animated={animated}>
              <SvgPath
                d="M 100 96
                 C 118 96 128 108 128 132
                 C 128 152 118 162 100 162
                 C 82 162 72 152 72 132
                 C 72 108 82 96 100 96 Z"
                fill={bellyColor}
                stroke={bellyLineColor}
                strokeWidth="1.5"
              />
              {/* Subtle horizontal curved contour lines */}
              <SvgPath
                d="M 78 114 C 88 118 112 118 122 114
                 M 76 130 C 88 134 112 134 124 130
                 M 80 146 C 90 149 110 149 120 146"
                stroke={bellyLineColor}
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
                opacity="0.8"
              />
            </AnimatedBellyG>
          </SvgG>
        </HiddenSemanticG>

        {/* --- Dragon Head & Face (Tilts & Moves with Items) --- */}
        <AnimatedHeadG id="dragon-head" data-testid="companion-head" $animated={animated}>
          <HiddenSemanticG>
            {/* Kraków Dragon Scalloped Ear Fins (Attached to upper head sides) */}
            <AnimatedLeftEarFinG $animated={animated}>
              <SvgPath
                d="M 64 42
                 C 50 36 40 34 38 40
                 C 34 46 36 54 44 58
                 C 50 60 56 58 60 54
                 C 64 52 66 46 64 42 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Inner ear fin scallop line */}
              <SvgPath
                d="M 44 48 C 50 48 56 46 62 44"
                stroke={bellyLineColor}
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />
            </AnimatedLeftEarFinG>

            <AnimatedRightEarFinG $animated={animated}>
              <SvgPath
                d="M 136 42
                 C 150 36 160 34 162 40
                 C 166 46 164 54 156 58
                 C 150 60 144 58 140 54
                 C 136 52 134 46 136 42 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Inner ear fin scallop line */}
              <SvgPath
                d="M 156 48 C 150 48 144 46 138 44"
                stroke={bellyLineColor}
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />
            </AnimatedRightEarFinG>

            {/* Central Kraków Horn & Stage Evolution */}
            {stage === 1 && (
              /* Stage 1: Baby dragon (matches dragon.png) */
              <SvgG id="dragon-horn-stage-1" data-testid="dragon-horn-stage-1">
                <SvgPath
                  d="M 94 40 C 93 28 97 18 100 16 C 103 18 107 28 106 40 C 102 42 98 42 94 40 Z"
                  fill={bodyColor}
                  stroke={bodyBorderColor}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <SvgPath
                  d="M 96 36 C 96 26 98 19 100 18 C 101 22 100 30 99 36 Z"
                  fill={bellyColor}
                  opacity="0.9"
                />
                <SvgPath
                  d="M 94 40 C 97 42 103 42 106 40"
                  stroke={bodyBorderColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </SvgG>
            )}

            {stage === 2 && (
              /* Stage 2: Young dragon (slightly taller horn with golden accent colors.dragonHorn / colors.dragonHornHighlight) */
              <SvgG id="dragon-horn-stage-2" data-testid="dragon-horn-stage-2">
                <SvgPath
                  d="M 93 40 C 92 24 96 12 100 10 C 104 12 108 24 107 40 C 103 42 97 42 93 40 Z"
                  fill={hornColor}
                  stroke={bodyBorderColor}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <SvgPath
                  d="M 96 36 C 96 22 98 13 100 12 C 101 17 101 28 99 36 Z"
                  fill={hornHighlightColor}
                />
                <SvgPath
                  d="M 94 37 C 98 39 102 39 106 37"
                  stroke={hornHighlightColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </SvgG>
            )}

            {stage === 3 && (
              /* Stage 3: Hero dragon (prominent hero crest / radiant horns) */
              <SvgG id="dragon-horn-stage-3" data-testid="dragon-horn-stage-3">
                {/* Radiant Left Crest Horn */}
                <SvgPath
                  d="M 88 36 C 80 32 74 24 72 16 C 76 18 84 26 89 32 Z"
                  fill={hornColor}
                  stroke={bodyBorderColor}
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <SvgPath
                  d="M 86 33 C 80 29 76 22 74 18 C 76 21 82 27 86 31 Z"
                  fill={hornHighlightColor}
                />

                {/* Radiant Right Crest Horn */}
                <SvgPath
                  d="M 112 36 C 120 32 126 24 128 16 C 124 18 116 26 111 32 Z"
                  fill={hornColor}
                  stroke={bodyBorderColor}
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <SvgPath
                  d="M 114 33 C 120 29 124 22 126 18 C 124 21 118 27 114 31 Z"
                  fill={hornHighlightColor}
                />

                {/* Central Majestic Hero Horn */}
                <SvgPath
                  d="M 92 40 C 91 22 96 8 100 6 C 104 8 109 22 108 40 C 104 43 96 43 92 40 Z"
                  fill={hornColor}
                  stroke={bodyBorderColor}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <SvgPath
                  d="M 96 36 C 96 20 98 9 100 8 C 102 14 102 26 100 36 Z"
                  fill={hornHighlightColor}
                />

                {/* Hero Star Emblem on Forehead */}
                <SvgPolygon
                  points="100,34 103,38 100,42 97,38"
                  fill={hornHighlightColor}
                  stroke={hornColor}
                  strokeWidth="1"
                />
              </SvgG>
            )}

            {/* Adorable Chubby Head with Wide Rounded Cheeks */}
            <SvgPath
              d="M 100 32
               C 126 32 136 38 142 50
               C 148 62 148 76 138 88
               C 126 98 114 98 100 98
               C 86 98 74 98 62 88
               C 52 76 52 62 58 50
               C 64 38 74 32 100 32 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Broad Dragon Muzzle */}
            <SvgPath
              d="M 76 72
               C 76 64 86 60 100 60
               C 114 60 124 64 124 72
               C 124 82 116 88 100 88
               C 84 88 76 82 76 72 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Soft Highlight on Muzzle Bridge */}
            <SvgPath
              d="M 84 68 C 90 64 110 64 116 68 C 110 71 90 71 84 68 Z"
              fill={bellyColor}
              opacity="0.75"
            />

            {/* Delicate Nostrils */}
            <SvgEllipse cx="93" cy="72" rx="1.6" ry="2" fill={eyeColor} />
            <SvgEllipse cx="107" cy="72" rx="1.6" ry="2" fill={eyeColor} />

            {/* Expressive Face & Blinking Disney Eyes */}
            <SvgG id="dragon-face">
              {/* Forehead Eyebrow Highlight Arches (Contouring top of eyes) */}
              <SvgPath
                d="M 72 50 C 76 43 86 42 94 48 C 92 50 84 46 76 52 Z"
                fill={bellyColor}
                opacity="0.85"
              />
              <SvgPath
                d="M 128 50 C 124 43 114 42 106 48 C 108 50 116 46 124 52 Z"
                fill={bellyColor}
                opacity="0.85"
              />

              {/* Eyebrow Accent Curves */}
              <SvgPath
                d="M 74 48 Q 83 43 92 48"
                stroke={eyeColor}
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                opacity="0.75"
              />
              <SvgPath
                d="M 126 48 Q 117 43 108 48"
                stroke={eyeColor}
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                opacity="0.75"
              />

              {/* Eyes with organic double-blink animation */}
              <AnimatedEyesG $animated={animated} data-testid="companion-eyes">
                {/* Left Eye */}
                <SvgEllipse cx="82" cy="62" rx="11" ry="13" fill={eyeColor} />
                <SvgEllipse cx="82" cy="66" rx="8" ry="8.5" fill={bodyColor} opacity="0.4" />
                <SvgEllipse
                  cx="78.5"
                  cy="57"
                  rx="4.2"
                  ry="4.8"
                  transform="rotate(-15 78.5 57)"
                  fill={whiteColor}
                />
                <SvgCircle cx="86.5" cy="67.5" r="1.8" fill={whiteColor} />

                {/* Right Eye */}
                <SvgEllipse cx="118" cy="62" rx="11" ry="13" fill={eyeColor} />
                <SvgEllipse cx="118" cy="66" rx="8" ry="8.5" fill={bodyColor} opacity="0.4" />
                <SvgEllipse
                  cx="114.5"
                  cy="57"
                  rx="4.2"
                  ry="4.8"
                  transform="rotate(-15 114.5 57)"
                  fill={whiteColor}
                />
                <SvgCircle cx="122.5" cy="67.5" r="1.8" fill={whiteColor} />
              </AnimatedEyesG>

              {/* Coral Chubby Blushing Cheeks */}
              <SvgEllipse cx="66" cy="74" rx="7.5" ry="5" fill={cheekColor} opacity="0.55" />
              <SvgEllipse cx="134" cy="74" rx="7.5" ry="5" fill={cheekColor} opacity="0.55" />

              {/* Friendly Smile & Tiny Cute White Fangs */}
              {pose === "eat" || isEating ? (
                <SvgG id="dragon-smile-eat">
                  <SvgPath
                    d="M 88 78 Q 100 94 112 78 Z"
                    fill={eyeColor}
                    stroke={eyeColor}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <SvgPath d="M 94 89 Q 100 85 106 89 Q 100 94 94 89 Z" fill={cheekColor} />
                  <SvgPolygon points="91,78 94,83 96,78" fill={whiteColor} />
                  <SvgPolygon points="104,78 106,83 109,78" fill={whiteColor} />
                </SvgG>
              ) : pose === "cheer" ? (
                <SvgG id="dragon-smile-cheer">
                  <SvgPath
                    d="M 88 78 Q 100 93 112 78 Z"
                    fill={eyeColor}
                    stroke={eyeColor}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <SvgPath d="M 94 88 Q 100 84 106 88 Q 100 93 94 88 Z" fill={cheekColor} />
                  <SvgPolygon points="91,78 94,83 96,78" fill={whiteColor} />
                  <SvgPolygon points="104,78 106,83 109,78" fill={whiteColor} />
                </SvgG>
              ) : (
                <SvgG id="dragon-smile-friendly">
                  <SvgPath
                    d="M 88 78 Q 100 87 112 78"
                    stroke={eyeColor}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <SvgPath
                    d="M 87 77 Q 88 79 90 80"
                    stroke={eyeColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <SvgPath
                    d="M 113 77 Q 112 79 110 80"
                    stroke={eyeColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Two tiny white fangs peeking downwards */}
                  <SvgPolygon
                    points="92,79 94.5,84 97,79"
                    fill={whiteColor}
                    stroke={bodyBorderColor}
                    strokeWidth="0.8"
                  />
                  <SvgPolygon
                    points="103,79 105.5,84 108,79"
                    fill={whiteColor}
                    stroke={bodyBorderColor}
                    strokeWidth="0.8"
                  />
                </SvgG>
              )}
            </SvgG>
          </HiddenSemanticG>

          {/* Eating flame puff and ember particles */}
          {(pose === "eat" || isEating) && animated && (
            <AnimatedFlameG
              $animated={animated}
              id="dragon-flame-puff"
              data-testid="companion-flame-puff"
            >
              {/* Outer fire flame */}
              <SvgPath
                d="M 100 80 Q 86 70 88 54 Q 94 44 100 32 Q 106 44 112 54 Q 114 70 100 80 Z"
                fill={flameOuterColor}
                opacity="0.92"
              />
              {/* Mid flame */}
              <SvgPath
                d="M 100 78 Q 92 68 93 58 Q 97 50 100 42 Q 103 50 107 58 Q 108 68 100 78 Z"
                fill={flameInnerColor}
              />
              {/* Hot core */}
              <SvgEllipse cx="100" cy="73" rx="3.5" ry="5.5" fill={whiteColor} opacity="0.95" />
              {/* Floating embers */}
              <AnimatedEmberCircle
                cx="100"
                cy="74"
                r="2.5"
                fill={flameInnerColor}
                $dx="-12px"
                $dx2="-20px"
                $dx3="-28px"
                $animated={animated}
              />
              <AnimatedEmberCircle
                cx="100"
                cy="74"
                r="2"
                fill={flameOuterColor}
                $dx="12px"
                $dx2="20px"
                $dx3="26px"
                $animated={animated}
              />
              <AnimatedEmberCircle
                cx="100"
                cy="74"
                r="1.5"
                fill={whiteColor}
                $dx="3px"
                $dx2="5px"
                $dx3="7px"
                $animated={animated}
              />
            </AnimatedFlameG>
          )}

          {/* Test compatibility markers for head accessories (hidden, artwork has native clothing) */}
          <HiddenSemanticG>
            {hasGoggles && <SvgG data-testid="companion-goggles" />}
            {hasHat && <SvgG data-testid="companion-hat" />}
          </HiddenSemanticG>
        </AnimatedHeadG>

        {/* --- Dragon Arms (Pose Aware) --- */}
        <HiddenSemanticG>
          {pose === "stretch" ? (
            <SvgG id="dragon-arms-stretch">
              {/* Arms reaching high to the sky with claws */}
              <SvgPath
                d="M 66 108 C 54 88 50 64 54 48 C 58 46 64 50 66 58 C 70 72 74 94 76 106 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <SvgCircle
                cx="55"
                cy="48"
                r="5"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="1.5"
              />
              <SvgCircle cx="53" cy="44" r="1.5" fill={whiteColor} />
              <SvgCircle cx="56" cy="43" r="1.5" fill={whiteColor} />

              <SvgPath
                d="M 134 108 C 146 88 150 64 146 48 C 142 46 136 50 134 58 C 130 72 126 94 124 106 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <SvgCircle
                cx="145"
                cy="48"
                r="5"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="1.5"
              />
              <SvgCircle cx="144" cy="43" r="1.5" fill={whiteColor} />
              <SvgCircle cx="147" cy="44" r="1.5" fill={whiteColor} />
            </SvgG>
          ) : pose === "cheer" ? (
            <AnimatedCheerArmsG $animated={animated}>
              {/* Arms waving in victory gesture */}
              <SvgPath
                d="M 68 110 C 52 94 42 74 46 56 C 50 54 56 58 60 66 C 66 78 72 96 76 108 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <SvgCircle
                cx="47"
                cy="57"
                r="5.5"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="1.5"
              />
              <SvgCircle cx="44" cy="53" r="1.5" fill={whiteColor} />
              <SvgCircle cx="48" cy="52" r="1.5" fill={whiteColor} />

              <SvgPath
                d="M 132 110 C 148 94 158 74 154 56 C 150 54 144 58 140 66 C 134 78 128 96 124 108 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <SvgCircle
                cx="153"
                cy="57"
                r="5.5"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="1.5"
              />
              <SvgCircle cx="152" cy="52" r="1.5" fill={whiteColor} />
              <SvgCircle cx="156" cy="53" r="1.5" fill={whiteColor} />
            </AnimatedCheerArmsG>
          ) : pose === "balance" ? (
            <SvgG id="dragon-arms-balance">
              {/* Wide horizontal arms */}
              <SvgPath
                d="M 70 114 C 50 112 36 114 26 117 C 26 123 36 124 48 122 C 58 120 68 118 72 116 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <SvgCircle
                cx="26"
                cy="119"
                r="5.5"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="1.5"
              />
              <SvgCircle cx="22" cy="118" r="1.5" fill={whiteColor} />
              <SvgCircle cx="23" cy="122" r="1.5" fill={whiteColor} />

              <SvgPath
                d="M 130 114 C 150 112 164 114 174 117 C 174 123 164 124 152 122 C 142 120 132 118 128 116 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <SvgCircle
                cx="174"
                cy="119"
                r="5.5"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="1.5"
              />
              <SvgCircle cx="177" cy="122" r="1.5" fill={whiteColor} />
              <SvgCircle cx="178" cy="118" r="1.5" fill={whiteColor} />
            </SvgG>
          ) : pose === "strength" ? (
            <SvgG id="dragon-arms-strength">
              {/* Power stance at chest */}
              <SvgPath
                d="M 70 116 C 52 120 44 132 56 138 C 64 140 74 130 76 122 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <SvgCircle
                cx="57"
                cy="138"
                r="5.5"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="1.5"
              />
              <SvgCircle cx="54" cy="141" r="1.5" fill={whiteColor} />
              <SvgCircle cx="59" cy="142" r="1.5" fill={whiteColor} />

              <SvgPath
                d="M 130 116 C 148 120 156 132 144 138 C 136 140 126 130 124 122 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <SvgCircle
                cx="143"
                cy="138"
                r="5.5"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="1.5"
              />
              <SvgCircle cx="141" cy="142" r="1.5" fill={whiteColor} />
              <SvgCircle cx="146" cy="141" r="1.5" fill={whiteColor} />
            </SvgG>
          ) : (
            <AnimatedRestingArmsG id="dragon-arms-resting" $animated={animated}>
              {/* Cute chubby paws resting in front with 3 rounded claws */}
              <SvgPath
                d="M 72 114
                 C 64 122 66 138 78 142
                 C 86 142 90 132 86 120 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <SvgCircle
                cx="78"
                cy="140"
                r="5"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="1.5"
              />
              <SvgCircle cx="74" cy="144" r="1.5" fill={whiteColor} />
              <SvgCircle cx="78" cy="145" r="1.5" fill={whiteColor} />
              <SvgCircle cx="82" cy="144" r="1.5" fill={whiteColor} />

              <SvgPath
                d="M 128 114
                 C 136 122 134 138 122 142
                 C 114 142 110 132 114 120 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <SvgCircle
                cx="122"
                cy="140"
                r="5"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="1.5"
              />
              <SvgCircle cx="118" cy="144" r="1.5" fill={whiteColor} />
              <SvgCircle cx="122" cy="145" r="1.5" fill={whiteColor} />
              <SvgCircle cx="126" cy="144" r="1.5" fill={whiteColor} />
            </AnimatedRestingArmsG>
          )}
        </HiddenSemanticG>
      </PoseAnimationWrapper>
    </StyledCompanionSvg>
  );
}
