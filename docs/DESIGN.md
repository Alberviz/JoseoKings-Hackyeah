# Design: parent area

**Status: decided by Alberto (2026-10-04).** Drawn icons, colour by section, floating tab bar. This file is the spec: follow it literally and do not invent variants. Questions go to Claude. Mockups (Tailscale `:8443`): `colorful.html`, `parent-style.html` (option 1, icon mode "Drawn").

Scope: every screen under `/parent` and the parent PIN gate. The child screens keep their own look.

## 1. Look

Hand-made notebook: cream grid paper, navy ink outlines, flat marker fills, a solid offset shadow like a cut-out sticker. Friendly, never clinical.

- Outline: `theme.borderWidth` in `theme.colors.ink`. Shadow: `theme.shadowPress` in ink, no blur.
- Pressed: shadow gone, element moves 2px right and 3px down (`pressable` in `Button.style.ts`). Never put `pressable` on a container that holds other buttons.
- Shape: everything that is a box uses the app's "leaf" corner (`theme.radius.leaf`: three round corners and one tight one): banner, section cards, the tab tray, the More sheet and its tiles, full-width buttons and option buttons. Inline buttons stay pills (`theme.radius.pill`), the gear and chips are round.
- Fonts: headings Bricolage Grotesque, body Atkinson Hyperlegible (already in the theme). No emoji anywhere.
- Touch targets at least `theme.touchTarget`. Text contrast at least 4.5:1. No horizontal scroll at 360px.
- Colour is never the only signal: every answer pill carries its words.

## 2. Section colours

Defined once in `theme.sections` (`src/theme/theme.ts`). Never write these hex values in a component.

| Section  | `fill` (banner, card headers, active tab) | `strong` (main button) | Text on `strong` | Button variant | Routes                                  |
| :------- | :---------------------------------------- | :--------------------- | :--------------- | :------------- | :-------------------------------------- |
| summary  | `#D5F1F0` primarySoft                     | `#127782` primary      | white            | `primary`      | `/parent`                               |
| log      | `#BFE8CC` green                           | `#1E7A46` success      | white            | `success`      | `/parent/log`                           |
| food     | `#FFD9CC` coralSoft                       | `#FF7A59` accent       | ink              | `accent`       | `/parent/foods`                         |
| patterns | `#E6DDF5` lavenderSoft                    | `#C6B5E8` lavender     | ink              | `lavender`     | `/parent/patterns`                      |
| more     | `#FFF0B8` highlightSoft                   | `#FFC93C` highlight    | ink              | `highlight`    | report, link, settings; PIN gate, setup |

Text on every `fill` is ink. Destructive actions always use `urgent` (red, white text), whatever the section.

## 3. Parts

Build screens only from these parts (all in `src/components/features/parent-mode/` unless noted).

1. **`ParentBanner`**: first element of every screen. Props: `section`, `icon`, `title`, `subtitle?`, `hasGear?` (default true; false on Settings and the PIN gate). A rounded sticker (`radius.lg`, ink outline, shadow, `fill` background), min height 56px: drawn icon 34px, then `Heading` level 1 and a short muted subtitle. Reserves room on the right for the gear (`touchTarget` + `spacing.sm`). Demo data chip goes in the subtitle row.
2. **Settings gear** (`SettingsLink` in `ParentNav`): 48px round sticker on the banner row, right edge, `surface` fill with the drawn yellow-centred gear. Hidden on Settings, in print and when locked.
3. **`SectionCard`**: surface body with ink outline, shadow and `radius.lg`, and a header strip in the section `fill` with an ink bottom border holding the card title (`Heading` level 2). Body padding `spacing.md`. Replaces `Card` on parent screens.
4. **`Chip`** (`src/components/ui`): the answer pill. Tones: `success` (good day, mint), `mixed` (yellow), `harder` (coral), `primary` (teal), `default` (surface). Always ink text.
5. **`Button` / `LinkButton`**: one main action per screen, in the section `Button` variant (table above), full width. Secondary actions use `secondary`. Lock and destructive actions never use a section colour.
6. **`ParentNav`** (floating tab bar): tray 12px above the bottom edge and 10px from the sides, `surface`, outline, shadow, radius 22px. Tabs: Summary, Log, Food, Patterns, More, each with its drawn icon (`ParentNavIcon`) and a label under it. The active tab is a pill filled with that section's `fill` and an ink outline. More opens a floating sheet with a 2 by 2 grid of sticker tiles, each a drawn icon over a short label: Doctor report (yellow), Family link (lavender), Lock (surface), Back to child mode (teal; never shown on a parent-only phone). Appears only after the PIN; never on setup; hidden when printing.
7. **Option buttons** (`OptionButton`, the big choices such as Physical activity): pass `section` so the selected option takes the section's `strong` colour and its text colour; unselected stay on surface.
8. **Icons**: `ParentNavIcon` only (drawn, 2.4px navy stroke, flat theme fills). Decorative (`aria-hidden`). New icons are added to that file in the same style, never emoji or images.

## 4. Screen recipe

Every parent screen has the same skeleton, inside `Screen`:

```
ParentBanner (section, icon, title, subtitle)
SectionCard x N        (the content, in the order the screen already has)
one main Button        (section variant, full width, last)
```

| Screen         | Section  | Icon       | Banner title    | Subtitle                          |
| :------------- | :------- | :--------- | :-------------- | :-------------------------------- |
| Summary        | summary  | `summary`  | Parent mode     | Daily summary for {child}         |
| Daily log      | log      | `log`      | Daily log       | Facts for the day                 |
| Food diary     | food     | `food`     | Food diary      | Notes to share with the care team |
| Patterns       | patterns | `patterns` | Patterns        | Last 7 days                       |
| Doctor report  | more     | `log`      | Doctor report   | Since the last visit              |
| Family link    | more     | `more`     | Family link     | Pair the two phones               |
| Settings       | more     | `settings` | Parent settings | This phone                        |
| PIN gate/setup | more     | `more`     | (its own title) | (its own text)                    |

## 5. Rules

- Keep every heading, label and button text that exists today, so tests and screen readers keep working. Style changes only, except the removals below.
- Navigation lives in the tab bar: no "Back to parent summary" links. Lock and "Back to child mode" live in the More sheet (and stay on the Summary).
- On a parent-only phone (`deviceRole === "parent"`) never show "Back to child mode".
- Wording follows `docs/PRODUCT.md` section 6: no medical claims, no scores, no alarming colours for the child's answers. Harder days use coral, not red.
- The doctor report is printed: print CSS removes the banner colours, the tab bar and the gear.
- Styles follow `AGENTS.md` section 3.2 (`.tsx` composes, `.style.ts` styles, theme tokens, `$` props). New colours go into `theme.ts` and `contrast.test.ts`.
- Tapping must never show a coloured box: the global style sets `-webkit-tap-highlight-color: transparent` on every element, `touch-action: manipulation` and no text selection on buttons, links and labels. Keep `:focus-visible` outlines for keyboard users.

## 6. Done when

- No parent screen shows a plain black-and-white card: each has its banner and coloured card headers.
- `pnpm check` passes, `contrast.test.ts` covers every `sections` pair.
- Looked at 360px and at 768px wide with the tab bar open and closed.
