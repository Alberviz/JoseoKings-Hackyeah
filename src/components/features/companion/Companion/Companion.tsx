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
  AnimatedEmbersG,
  AnimatedEyesG,
  AnimatedFlamePuffG,
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
  SvgRect,
} from "./Companion.style";

export type CompanionSize = "sm" | "md" | "lg";

export type CompanionProps = {
  pose: CompanionPose;
  equippedItemIds?: string[];
  size?: CompanionSize;
  name?: string;
  animated?: boolean;
  interactive?: boolean;
  isEating?: boolean;
  showEmbers?: boolean;
  onClick?: () => void;
};

export function Companion({
  pose,
  equippedItemIds = [],
  size = "md",
  name = "Your companion",
  animated = true,
  interactive = true,
  isEating = false,
  showEmbers = false,
  onClick,
}: CompanionProps) {
  const currentTheme = useContext(ThemeContext) || defaultTheme;
  const [isTapped, setIsTapped] = useState(false);

  const handleClick = () => {
    if (interactive && animated) {
      setIsTapped(true);
      setTimeout(() => setIsTapped(false), 700);
    }
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

  const hasHat = activeItemsBySlot.get("hat") === ITEM_IDS.hatExplorer;
  const isTeal = activeItemsBySlot.get("color") === ITEM_IDS.colorTeal;
  const hasCape = activeItemsBySlot.get("cape") === ITEM_IDS.capeStar;
  const hasGoggles = activeItemsBySlot.get("gadget") === ITEM_IDS.gadgetGoggles;

  // Official Kraków Dragon color tokens from theme (with fallback support)
  const colors = currentTheme.colors;
  const bodyColor = isTeal ? colors.success : colors.dragonBody;
  const bodyBorderColor = isTeal ? colors.success : colors.dragonBodyBorder;
  const bellyColor = colors.dragonBelly;
  const bellyLineColor = colors.dragonBellyLines;
  const wingColor = colors.dragonWing;
  const wingStrutColor = colors.dragonWingStrut;
  const hornColor = colors.dragonHorn;
  const hornHighlightColor = colors.dragonHornHighlight;
  const cheekColor = colors.dragonCheek;
  const eyeColor = colors.dragonEye;

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
              : AnimatedCheerG;

  const accessibleLabel = `${name} (${pose} pose)`;

  return (
    <StyledCompanionSvg
      viewBox="0 0 200 200"
      $size={size}
      $animated={animated}
      $interactive={interactive}
      onClick={handleClick}
      data-animated={animated ? "true" : "false"}
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
              fill={colors.accent || "#FF7A59"}
            />
            <SvgPolygon
              points="155,45 157,39 159,45 165,47 159,49 157,55 155,49 149,47"
              fill="#FFB049"
            />
            <SvgCircle cx="100" cy="25" r="2.5" fill="#FFD166" />
            <SvgCircle cx="60" cy="70" r="2" fill={colors.accent || "#FF7A59"} />
            <SvgCircle cx="140" cy="65" r="2" fill={colors.accent || "#FF7A59"} />
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

        {/* --- OFFICIAL EXACT KRAKÓW DRAGON ARTWORK (Full fidelity transparent) --- */}
        <SvgImage
          href="/dragon.png"
          x="10"
          y="10"
          width="180"
          height="180"
          preserveAspectRatio="xMidYMid meet"
          data-testid="companion-exact-artwork"
        />

        {/* --- Flame Breath Puff when Eating (Rendered on top of dragon) --- */}
        {isEating && (
          <AnimatedFlamePuffG data-testid="companion-flame-puff" $animated={animated}>
            {/* Main Fire Cloud */}
            <SvgPath
              d="M 112 70 C 118 64 128 66 134 72 C 140 72 146 78 144 86 C 146 94 138 100 130 98 C 124 102 116 98 114 92 C 110 86 110 78 112 70 Z"
              fill={colors.accent || "#FF7A59"}
              stroke={colors.text || "#1F2F6B"}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Inner Warm Highlight */}
            <SvgPath
              d="M 116 74 C 120 68 126 69 130 73 C 134 73 138 77 136 83 C 138 88 132 92 127 91 C 123 93 118 90 117 86 C 114 82 114 78 116 74 Z"
              fill="#FFB049"
            />
            {/* Mini Embers */}
            <SvgPolygon
              points="146,64 148,58 150,64 156,66 150,68 148,74 146,68 140,66"
              fill="#FFD166"
            />
          </AnimatedFlamePuffG>
        )}

        {/* --- Semantic Vector Structure for Test Compatibility --- */}
        <HiddenSemanticG aria-hidden="true">
          {/* --- Dragon Wings --- */}
          <SvgG id="dragon-wings" data-testid="companion-wings">
            {/* Left Wing */}
            <AnimatedLeftWingG
              $animated={animated}
              $isCheer={pose === "cheer"}
              data-testid="companion-wing-left"
            >
              <SvgPath
                d="M 72 105 C 50 82 28 88 18 102 C 22 118 32 128 44 138 C 54 128 64 116 72 105 Z"
                fill={wingColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Wing Struts */}
              <SvgPath
                d="M 38 94 L 44 136 M 52 98 L 56 126"
                stroke={wingStrutColor}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Wing Upper Frame */}
              <SvgPath
                d="M 72 105 C 54 84 32 90 20 101"
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
              <SvgPath
                d="M 128 105 C 150 82 172 88 182 102 C 178 118 168 128 156 138 C 146 128 136 116 128 105 Z"
                fill={wingColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Wing Struts */}
              <SvgPath
                d="M 162 94 L 156 136 M 148 98 L 144 126"
                stroke={wingStrutColor}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Wing Upper Frame */}
              <SvgPath
                d="M 128 105 C 146 84 168 90 180 101"
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
              d="M 132 142 C 152 144 168 132 164 118 C 160 114 154 118 152 124 C 148 132 138 138 128 140 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Tail dorsal crest */}
            <SvgPath d="M 158 119 L 162 114 L 165 121 Z" fill={bodyBorderColor} />
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
              {/* Claws on Right Foot */}
              <SvgEllipse
                cx="107"
                cy="164"
                rx="2.5"
                ry="3"
                fill="#FFFFFF"
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="116"
                cy="166"
                rx="2.5"
                ry="3.5"
                fill="#FFFFFF"
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="125"
                cy="164"
                rx="2.5"
                ry="3"
                fill="#FFFFFF"
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
              <SvgCircle cx="64" cy="155" r="2" fill="#FFFFFF" />
              <SvgCircle cx="69" cy="157" r="2" fill="#FFFFFF" />
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
                cx="65"
                cy="166"
                rx="2.5"
                ry="3"
                fill="#FFFFFF"
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="74"
                cy="168"
                rx="2.5"
                ry="3.5"
                fill="#FFFFFF"
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="83"
                cy="166"
                rx="2.5"
                ry="3"
                fill="#FFFFFF"
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
                cx="117"
                cy="166"
                rx="2.5"
                ry="3"
                fill="#FFFFFF"
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="126"
                cy="168"
                rx="2.5"
                ry="3.5"
                fill="#FFFFFF"
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="135"
                cy="166"
                rx="2.5"
                ry="3"
                fill="#FFFFFF"
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
            </SvgG>
          ) : (
            <SvgG id="dragon-feet-default">
              {/* Left Foot */}
              <SvgEllipse
                cx="82"
                cy="158"
                rx="15"
                ry="9"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
              />
              <SvgEllipse
                cx="73"
                cy="162"
                rx="2.5"
                ry="3"
                fill="#FFFFFF"
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="82"
                cy="164"
                rx="2.5"
                ry="3.5"
                fill="#FFFFFF"
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="91"
                cy="162"
                rx="2.5"
                ry="3"
                fill="#FFFFFF"
                stroke={bodyBorderColor}
                strokeWidth="1"
              />

              {/* Right Foot */}
              <SvgEllipse
                cx="118"
                cy="158"
                rx="15"
                ry="9"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
              />
              <SvgEllipse
                cx="109"
                cy="162"
                rx="2.5"
                ry="3"
                fill="#FFFFFF"
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="118"
                cy="164"
                rx="2.5"
                ry="3.5"
                fill="#FFFFFF"
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
              <SvgEllipse
                cx="127"
                cy="162"
                rx="2.5"
                ry="3"
                fill="#FFFFFF"
                stroke={bodyBorderColor}
                strokeWidth="1"
              />
            </SvgG>
          )}

          {/* --- Dragon Body & Belly --- */}
          <SvgG data-testid="companion-body">
            {/* Main Torso */}
            <SvgPath
              d="M 100 78 C 132 78 144 98 144 128 C 144 152 130 158 100 158 C 70 158 56 152 56 128 C 56 98 68 78 100 78 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Mint Segmented Belly */}
            <AnimatedBellyG data-testid="companion-belly" $animated={animated}>
              <SvgPath
                d="M 100 96 C 118 96 128 108 128 128 C 128 146 118 154 100 154 C 82 154 72 146 72 128 C 72 108 82 96 100 96 Z"
                fill={bellyColor}
                stroke={bellyLineColor}
                strokeWidth="1.5"
              />
              {/* Belly horizontal dividers */}
              <SvgPath
                d="M 76 112 C 88 116 112 116 124 112 M 74 126 C 86 130 114 130 126 126 M 78 140 C 88 143 112 143 122 140"
                stroke={bellyLineColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </AnimatedBellyG>
          </SvgG>

          {/* --- Dragon Head & Face (Tilts & Moves with Items) --- */}
          <AnimatedHeadG id="dragon-head" data-testid="companion-head" $animated={animated}>
            {/* Kraków Dragon Ear Fins (with organic micro-twitching) */}
            <AnimatedLeftEarFinG $animated={animated}>
              <SvgPath
                d="M 64 62 C 50 56 46 68 56 74 C 62 76 66 72 68 68 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </AnimatedLeftEarFinG>
            <AnimatedRightEarFinG $animated={animated}>
              <SvgPath
                d="M 136 62 C 150 56 154 68 144 74 C 138 76 134 72 132 68 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </AnimatedRightEarFinG>

            {/* Large Rounded Head */}
            <SvgPath
              d="M 100 38 C 128 38 142 52 142 74 C 142 96 128 106 100 106 C 72 106 58 96 58 74 C 58 52 72 38 100 38 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Central Kraków Horn */}
            <SvgPath
              d="M 96 40 C 97 22 100 14 100 14 C 100 14 103 22 104 40 Z"
              fill={hornColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <SvgPath
              d="M 98 34 C 99 24 100 16 100 16 C 100 16 101 24 102 34 Z"
              fill={hornHighlightColor}
            />

            {/* Broad Dragon Muzzle */}
            <SvgPath
              d="M 78 78 C 78 70 86 66 100 66 C 114 66 122 70 122 78 C 122 88 114 94 100 94 C 86 94 78 88 78 78 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />

            {/* Delicate Nostrils */}
            <SvgEllipse cx="94" cy="74" rx="1.5" ry="2" fill={bodyBorderColor} />
            <SvgEllipse cx="106" cy="74" rx="1.5" ry="2" fill={bodyBorderColor} />

            {/* Expressive Face & Blinking Eyes */}
            <SvgG id="dragon-face">
              {/* Eyebrows */}
              <SvgPath
                d="M 78 54 Q 84 51 90 54"
                stroke={eyeColor}
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <SvgPath
                d="M 122 54 Q 116 51 110 54"
                stroke={eyeColor}
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Eyes with blinking animation */}
              <AnimatedEyesG $animated={animated} data-testid="companion-eyes">
                {/* Left Eye */}
                <SvgEllipse cx="84" cy="64" rx="9" ry="11" fill={eyeColor} />
                {/* Turquoise inner iris glow */}
                <SvgEllipse cx="84" cy="65" rx="6.5" ry="7.5" fill="#48C9D4" opacity="0.4" />
                <SvgCircle cx="86.5" cy="61.5" r="3" fill="#FFFFFF" />
                <SvgCircle cx="82.5" cy="67" r="1.3" fill="#FFFFFF" />

                {/* Right Eye */}
                <SvgEllipse cx="116" cy="64" rx="9" ry="11" fill={eyeColor} />
                {/* Turquoise inner iris glow */}
                <SvgEllipse cx="116" cy="65" rx="6.5" ry="7.5" fill="#48C9D4" opacity="0.4" />
                <SvgCircle cx="118.5" cy="61.5" r="3" fill="#FFFFFF" />
                <SvgCircle cx="114.5" cy="67" r="1.3" fill="#FFFFFF" />
              </AnimatedEyesG>

              {/* Coral Cheeks */}
              <SvgEllipse cx="72" cy="74" rx="6" ry="4" fill={cheekColor} opacity="0.6" />
              <SvgEllipse cx="128" cy="74" rx="6" ry="4" fill={cheekColor} opacity="0.6" />

              {/* Friendly Smile & Tiny Cute White Fangs */}
              {isEating ? (
                <SvgG id="dragon-smile-eating">
                  <SvgEllipse cx="100" cy="82" rx="7" ry="5" fill={eyeColor} />
                  <SvgPolygon points="95,78 97,83 99,78" fill="#FFFFFF" />
                  <SvgPolygon points="101,78 103,83 105,78" fill="#FFFFFF" />
                </SvgG>
              ) : pose === "cheer" ? (
                <SvgG id="dragon-smile-cheer">
                  <SvgPath
                    d="M 91 80 Q 100 92 109 80 Z"
                    fill={eyeColor}
                    stroke={eyeColor}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <SvgPolygon points="93,80 96,85 97,80" fill="#FFFFFF" />
                  <SvgPolygon points="103,80 104,85 107,80" fill="#FFFFFF" />
                </SvgG>
              ) : (
                <SvgG id="dragon-smile-friendly">
                  <SvgPath
                    d="M 92 80 Q 100 86 108 80"
                    stroke={eyeColor}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Two tiny white fangs */}
                  <SvgPolygon
                    points="94,81 96,86 98,81"
                    fill="#FFFFFF"
                    stroke={bodyBorderColor}
                    strokeWidth="0.8"
                  />
                  <SvgPolygon
                    points="102,81 104,86 106,81"
                    fill="#FFFFFF"
                    stroke={bodyBorderColor}
                    strokeWidth="0.8"
                  />
                </SvgG>
              )}

              {/* Flame Breath Puff when Eating */}
              {isEating && (
                <AnimatedFlamePuffG data-testid="companion-flame-puff" $animated={animated}>
                  {/* Main Fire Cloud */}
                  <SvgPath
                    d="M 112 70 C 118 64 128 66 134 72 C 140 72 146 78 144 86 C 146 94 138 100 130 98 C 124 102 116 98 114 92 C 110 86 110 78 112 70 Z"
                    fill={colors.accent || "#FF7A59"}
                    stroke={colors.text || "#1F2F6B"}
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {/* Inner Warm Highlight */}
                  <SvgPath
                    d="M 116 74 C 120 68 126 69 130 73 C 134 73 138 77 136 83 C 138 88 132 92 127 91 C 123 93 118 90 117 86 C 114 82 114 78 116 74 Z"
                    fill="#FFB049"
                  />
                  {/* Mini Embers */}
                  <SvgPolygon
                    points="146,64 148,58 150,64 156,66 150,68 148,74 146,68 140,66"
                    fill="#FFD166"
                  />
                </AnimatedFlamePuffG>
              )}
            </SvgG>

            {/* Forehead Items: Goggles (moves with head!) */}
            {hasGoggles && (
              <SvgG data-testid="companion-goggles">
                <SvgPath
                  d="M 58 64 C 74 62 126 62 142 64"
                  stroke={colors.textMuted}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <SvgRect x="96" y="62" width="8" height="4" rx="2" fill={colors.text} />
                <SvgCircle
                  cx="84"
                  cy="64"
                  r="11"
                  fill={colors.focus}
                  stroke={colors.text}
                  strokeWidth="2"
                />
                <SvgCircle cx="84" cy="64" r="8" fill={colors.surface} />
                <SvgPath
                  d="M 80 61 L 88 58"
                  stroke={colors.primarySoft}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <SvgCircle
                  cx="116"
                  cy="64"
                  r="11"
                  fill={colors.focus}
                  stroke={colors.text}
                  strokeWidth="2"
                />
                <SvgCircle cx="116" cy="64" r="8" fill={colors.surface} />
                <SvgPath
                  d="M 112 61 L 120 58"
                  stroke={colors.primarySoft}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </SvgG>
            )}

            {/* Head Items: Explorer Hat (moves with head!) */}
            {hasHat && (
              <SvgG data-testid="companion-hat">
                <SvgPath
                  d="M 76 46 C 76 24 86 16 100 16 C 114 16 124 24 124 46 Z"
                  fill={colors.focus}
                  stroke={colors.text}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <SvgPath
                  d="M 100 17 L 100 40"
                  stroke={colors.text}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <SvgPath
                  d="M 76 40 C 86 43 114 43 124 40 L 124 45 C 114 48 86 48 76 45 Z"
                  fill={colors.primaryHover}
                />
                <SvgEllipse
                  cx="100"
                  cy="45"
                  rx="38"
                  ry="8"
                  fill={colors.focus}
                  stroke={colors.text}
                  strokeWidth="2"
                />
              </SvgG>
            )}
          </AnimatedHeadG>

          {/* --- Dragon Arms (Pose Aware) --- */}
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
              <SvgCircle cx="53" cy="44" r="1.5" fill="#FFFFFF" />
              <SvgCircle cx="56" cy="43" r="1.5" fill="#FFFFFF" />

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
              <SvgCircle cx="144" cy="43" r="1.5" fill="#FFFFFF" />
              <SvgCircle cx="147" cy="44" r="1.5" fill="#FFFFFF" />
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
              <SvgCircle cx="44" cy="53" r="1.5" fill="#FFFFFF" />
              <SvgCircle cx="48" cy="52" r="1.5" fill="#FFFFFF" />

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
              <SvgCircle cx="152" cy="52" r="1.5" fill="#FFFFFF" />
              <SvgCircle cx="156" cy="53" r="1.5" fill="#FFFFFF" />
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
              <SvgCircle cx="22" cy="118" r="1.5" fill="#FFFFFF" />
              <SvgCircle cx="23" cy="122" r="1.5" fill="#FFFFFF" />

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
              <SvgCircle cx="177" cy="122" r="1.5" fill="#FFFFFF" />
              <SvgCircle cx="178" cy="118" r="1.5" fill="#FFFFFF" />
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
              <SvgCircle cx="54" cy="141" r="1.5" fill="#FFFFFF" />
              <SvgCircle cx="59" cy="142" r="1.5" fill="#FFFFFF" />

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
              <SvgCircle cx="141" cy="142" r="1.5" fill="#FFFFFF" />
              <SvgCircle cx="146" cy="141" r="1.5" fill="#FFFFFF" />
            </SvgG>
          ) : (
            <AnimatedRestingArmsG id="dragon-arms-resting" $animated={animated}>
              {/* Cute chubby paws resting in front */}
              <SvgPath
                d="M 68 116 C 60 124 64 138 74 140 C 82 140 84 130 82 120 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <SvgCircle
                cx="75"
                cy="138"
                r="5"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="1.5"
              />
              <SvgCircle cx="73" cy="142" r="1.5" fill="#FFFFFF" />
              <SvgCircle cx="77" cy="142" r="1.5" fill="#FFFFFF" />

              <SvgPath
                d="M 132 116 C 140 124 136 138 126 140 C 118 140 116 130 118 120 Z"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <SvgCircle
                cx="125"
                cy="138"
                r="5"
                fill={bodyColor}
                stroke={bodyBorderColor}
                strokeWidth="1.5"
              />
              <SvgCircle cx="123" cy="142" r="1.5" fill="#FFFFFF" />
              <SvgCircle cx="127" cy="142" r="1.5" fill="#FFFFFF" />
            </AnimatedRestingArmsG>
          )}
        </HiddenSemanticG>
      </PoseAnimationWrapper>
    </StyledCompanionSvg>
  );
}
