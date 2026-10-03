"use client";

import { useTheme } from "styled-components";
import { theme as defaultTheme } from "@/theme/theme";
import { ITEM_IDS } from "@/config/content-ids";
import { COMPANION_ITEMS } from "@/lib/rewards";
import type { CompanionItemSlot } from "@/types";
import type { CompanionPose } from "./poses";
import {
  AnimatedBalanceG,
  AnimatedBreatheG,
  AnimatedCheerArmsG,
  AnimatedCheerG,
  AnimatedEyesG,
  AnimatedIdleG,
  AnimatedStrengthG,
  AnimatedStretchG,
  StyledCompanionSvg,
  SvgCircle,
  SvgEllipse,
  SvgG,
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
};

export function Companion({
  pose,
  equippedItemIds = [],
  size = "md",
  name = "Your companion",
}: CompanionProps) {
  const currentTheme = useTheme() || defaultTheme;

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

  // Body colors: if teal is equipped, use closest theme token (success / successSoft)
  const bodyColor = isTeal ? currentTheme.colors.success : currentTheme.colors.primary;
  const bodyBorderColor = isTeal ? currentTheme.colors.success : currentTheme.colors.primaryHover;
  const accentSoft = isTeal ? currentTheme.colors.successSoft : currentTheme.colors.primarySoft;

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
      role="img"
      aria-label={accessibleLabel}
      data-testid="companion-svg"
    >
      <PoseAnimationWrapper>
        {/* --- Back Layer: Cape --- */}
        {hasCape && (
          <SvgG data-testid="companion-cape">
            {/* Flowing cape shape */}
            <SvgPath
              d="M 68 86 C 54 120 46 152 42 168 C 64 162 84 166 100 160 C 116 166 136 162 158 168 C 154 152 146 120 132 86 Z"
              fill={currentTheme.colors.urgent}
              stroke={currentTheme.colors.text}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Star emblem on cape */}
            <SvgPolygon
              points="100,122 103,129 111,129 105,133 107,140 100,136 93,140 95,133 89,129 97,129"
              fill={currentTheme.colors.focus}
              stroke={currentTheme.colors.text}
              strokeWidth="1"
            />
          </SvgG>
        )}

        {/* --- Legs / Feet --- */}
        {pose === "balance" ? (
          <SvgG>
            {/* Planted right leg */}
            <SvgRect
              x="100"
              y="138"
              width="14"
              height="18"
              rx="6"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
            <SvgEllipse
              cx="107"
              cy="156"
              rx="15"
              ry="9"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
            {/* Lifted and tucked left leg (flamingo / tree balance pose) */}
            <SvgPath
              d="M 85 130 C 62 130 56 142 66 148 C 76 150 86 142 96 140"
              fill="none"
              stroke={bodyColor}
              strokeWidth="10"
              strokeLinecap="round"
            />
            <SvgCircle
              cx="64"
              cy="147"
              r="7"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
          </SvgG>
        ) : pose === "strength" ? (
          <SvgG>
            {/* Squat / wall-sit stance: legs bent wide and sturdy */}
            <SvgPath
              d="M 76 136 C 58 140 50 152 56 160"
              fill="none"
              stroke={bodyColor}
              strokeWidth="11"
              strokeLinecap="round"
            />
            <SvgEllipse
              cx="58"
              cy="161"
              rx="14"
              ry="8"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
            <SvgPath
              d="M 124 136 C 142 140 150 152 144 160"
              fill="none"
              stroke={bodyColor}
              strokeWidth="11"
              strokeLinecap="round"
            />
            <SvgEllipse
              cx="142"
              cy="161"
              rx="14"
              ry="8"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
          </SvgG>
        ) : (
          <SvgG>
            {/* Standing feet (idle, breathe, stretch, cheer) */}
            <SvgRect
              x="72"
              y="138"
              width="14"
              height="18"
              rx="6"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
            <SvgEllipse
              cx="79"
              cy="156"
              rx="15"
              ry="9"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
            <SvgRect
              x="114"
              y="138"
              width="14"
              height="18"
              rx="6"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
            <SvgEllipse
              cx="121"
              cy="156"
              rx="15"
              ry="9"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
          </SvgG>
        )}

        {/* --- Main Body and Head --- */}
        <SvgG data-testid="companion-body">
          {/* Hero crests / ears on head */}
          <SvgPath
            d="M 76 66 C 63 46 66 32 78 28 C 84 38 86 52 86 64 Z"
            fill={bodyColor}
            stroke={bodyBorderColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <SvgPath d="M 77 60 C 69 47 71 38 78 34 C 82 41 83 50 83 58 Z" fill={accentSoft} />
          <SvgPath
            d="M 124 66 C 137 46 134 32 122 28 C 116 38 114 52 114 64 Z"
            fill={bodyColor}
            stroke={bodyBorderColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <SvgPath d="M 123 60 C 131 47 129 38 122 34 C 118 41 117 50 117 58 Z" fill={accentSoft} />

          {/* Rounded hero body */}
          <SvgPath
            d="M 100 48 C 134 48 148 70 148 104 C 148 136 132 148 100 148 C 68 148 52 136 52 104 C 52 70 66 48 100 48 Z"
            fill={bodyColor}
            stroke={bodyBorderColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Chest / Belly hero shield accent */}
          <SvgPath
            d="M 100 84 C 118 84 128 96 128 116 C 128 134 116 142 100 142 C 84 142 72 134 72 116 C 72 96 82 84 100 84 Z"
            fill={accentSoft}
          />
        </SvgG>

        {/* --- Expressive Face --- */}
        <SvgG>
          {/* Eyebrows: confident & positive hero spirit */}
          <SvgPath
            d="M 74 76 Q 83 73 91 77"
            stroke={currentTheme.colors.text}
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <SvgPath
            d="M 126 76 Q 117 73 109 77"
            stroke={currentTheme.colors.text}
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Eyes with blinking animation */}
          <AnimatedEyesG>
            {/* Left Eye */}
            <SvgEllipse
              cx="82"
              cy="92"
              rx="11"
              ry="13"
              fill={currentTheme.colors.surface}
              stroke={currentTheme.colors.text}
              strokeWidth="2"
            />
            <SvgCircle cx="84" cy="92" r="6.5" fill={currentTheme.colors.text} />
            <SvgCircle cx="86" cy="89" r="2.2" fill={currentTheme.colors.surface} />
            <SvgCircle cx="82" cy="95" r="1.2" fill={currentTheme.colors.surface} />

            {/* Right Eye */}
            <SvgEllipse
              cx="118"
              cy="92"
              rx="11"
              ry="13"
              fill={currentTheme.colors.surface}
              stroke={currentTheme.colors.text}
              strokeWidth="2"
            />
            <SvgCircle cx="116" cy="92" r="6.5" fill={currentTheme.colors.text} />
            <SvgCircle cx="118" cy="89" r="2.2" fill={currentTheme.colors.surface} />
            <SvgCircle cx="114" cy="95" r="1.2" fill={currentTheme.colors.surface} />
          </AnimatedEyesG>

          {/* Friendly warm cheeks */}
          <SvgEllipse cx="67" cy="104" rx="5.5" ry="3.5" fill={accentSoft} opacity="0.85" />
          <SvgEllipse cx="133" cy="104" rx="5.5" ry="3.5" fill={accentSoft} opacity="0.85" />

          {/* Positive Smile */}
          {pose === "cheer" ? (
            <SvgPath
              d="M 91 107 Q 100 120 109 107 Z"
              fill={currentTheme.colors.text}
              stroke={currentTheme.colors.text}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          ) : (
            <SvgPath
              d="M 93 108 Q 100 116 107 108"
              stroke={currentTheme.colors.text}
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </SvgG>

        {/* --- Arms --- */}
        {pose === "stretch" ? (
          <SvgG>
            {/* Arms reaching high to the sky */}
            <SvgPath
              d="M 62 94 C 54 75 48 52 50 38 C 54 36 60 40 62 48 C 66 60 70 82 72 92 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <SvgCircle
              cx="51"
              cy="38"
              r="6"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
            <SvgPath
              d="M 138 94 C 146 75 152 52 150 38 C 146 36 140 40 138 48 C 134 60 130 82 128 92 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <SvgCircle
              cx="149"
              cy="38"
              r="6"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
          </SvgG>
        ) : pose === "cheer" ? (
          <AnimatedCheerArmsG>
            {/* Arms in victory \o/ gesture */}
            <SvgPath
              d="M 64 96 C 50 82 38 64 42 46 C 46 44 52 48 56 56 C 62 68 68 84 72 94 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <SvgCircle
              cx="43"
              cy="47"
              r="6"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
            <SvgPath
              d="M 136 96 C 150 82 162 64 158 46 C 154 44 148 48 144 56 C 138 68 132 84 128 94 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <SvgCircle
              cx="157"
              cy="47"
              r="6"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
          </AnimatedCheerArmsG>
        ) : pose === "balance" ? (
          <SvgG>
            {/* Wide horizontal arms for balance */}
            <SvgPath
              d="M 66 100 C 48 100 36 102 28 105 C 28 111 36 112 48 110 C 58 108 66 106 70 104 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <SvgCircle
              cx="27"
              cy="107"
              r="6"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
            <SvgPath
              d="M 134 100 C 152 100 164 102 172 105 C 172 111 164 112 152 110 C 142 108 134 106 130 104 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <SvgCircle
              cx="173"
              cy="107"
              r="6"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
          </SvgG>
        ) : pose === "strength" ? (
          <SvgG>
            {/* Power stance: elbows bent firmly at chest */}
            <SvgPath
              d="M 68 102 C 50 108 42 120 54 126 C 62 128 72 118 74 110 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <SvgCircle
              cx="55"
              cy="126"
              r="6"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
            <SvgPath
              d="M 132 102 C 150 108 158 120 146 126 C 138 128 128 118 126 110 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <SvgCircle
              cx="145"
              cy="126"
              r="6"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
          </SvgG>
        ) : (
          <SvgG>
            {/* Resting arms (idle, breathe) */}
            <SvgPath
              d="M 58 98 C 46 108 46 122 56 128 C 62 126 64 116 62 106 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <SvgCircle
              cx="55"
              cy="127"
              r="5.5"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
            <SvgPath
              d="M 142 98 C 154 108 154 122 144 128 C 138 126 136 116 138 106 Z"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <SvgCircle
              cx="145"
              cy="127"
              r="5.5"
              fill={bodyColor}
              stroke={bodyBorderColor}
              strokeWidth="2"
            />
          </SvgG>
        )}

        {/* --- Forehead Items: Goggles --- */}
        {hasGoggles && (
          <SvgG data-testid="companion-goggles">
            {/* Strap around head */}
            <SvgPath
              d="M 52 82 C 70 80 130 80 148 82"
              stroke={currentTheme.colors.textMuted}
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Bridge */}
            <SvgRect x="96" y="79" width="8" height="4" rx="2" fill={currentTheme.colors.text} />
            {/* Left lens frame */}
            <SvgCircle
              cx="82"
              cy="81"
              r="12"
              fill={currentTheme.colors.focus}
              stroke={currentTheme.colors.text}
              strokeWidth="2"
            />
            {/* Left lens glass */}
            <SvgCircle cx="82" cy="81" r="8.5" fill={currentTheme.colors.surface} />
            {/* Left lens glare */}
            <SvgPath
              d="M 77 78 L 86 74"
              stroke={currentTheme.colors.primarySoft}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Right lens frame */}
            <SvgCircle
              cx="118"
              cy="81"
              r="12"
              fill={currentTheme.colors.focus}
              stroke={currentTheme.colors.text}
              strokeWidth="2"
            />
            {/* Right lens glass */}
            <SvgCircle cx="118" cy="81" r="8.5" fill={currentTheme.colors.surface} />
            {/* Right lens glare */}
            <SvgPath
              d="M 113 78 L 122 74"
              stroke={currentTheme.colors.primarySoft}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </SvgG>
        )}

        {/* --- Head Items: Explorer Hat --- */}
        {hasHat && (
          <SvgG data-testid="companion-hat">
            {/* Explorer crown */}
            <SvgPath
              d="M 74 54 C 74 30 84 22 100 22 C 116 22 126 30 126 54 Z"
              fill={currentTheme.colors.focus}
              stroke={currentTheme.colors.text}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Crown center ridge */}
            <SvgPath
              d="M 100 23 L 100 48"
              stroke={currentTheme.colors.text}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Hat band */}
            <SvgPath
              d="M 74 48 C 84 51 116 51 126 48 L 126 53 C 116 56 84 56 74 53 Z"
              fill={currentTheme.colors.primaryHover}
            />
            {/* Explorer brim */}
            <SvgEllipse
              cx="100"
              cy="53"
              rx="40"
              ry="9"
              fill={currentTheme.colors.focus}
              stroke={currentTheme.colors.text}
              strokeWidth="2"
            />
          </SvgG>
        )}
      </PoseAnimationWrapper>
    </StyledCompanionSvg>
  );
}
