# Design: parent area

Visual rules for every parent screen. Use the theme tokens in `src/theme/theme.ts` and the primitives in `src/components/ui`. Mockups: Tailscale `:8443` (`colorful.html`, `parent-style.html`). Status: proposed by Alberto's stream, colour level (option 1 or 2) pending his choice.

## Look

Hand-made notebook: cream grid paper, navy ink outlines, flat marker fills, a solid offset shadow like a cut-out sticker. Friendly, never clinical.

- Outline: `theme.borderWidth` in `theme.colors.ink`. Shadow: `theme.shadowPress` in ink, no blur. Pressed: shadow gone, element moves 2px right and 3px down (the `pressable` mixin).
- Radius: cards `theme.radius.lg`, buttons 12 to 14px, tray 22px, round buttons `theme.radius.pill`.
- Fonts: headings Bricolage Grotesque, body Atkinson Hyperlegible. No emoji anywhere: icons are drawn.
- Touch targets at least `theme.touchTarget` (48px). Text contrast at least 4.5:1. Text on any colour fill is ink, except white on teal and on red.

## Section colours (option 1)

| Section                       | Fill          | Strong (main button) |
| :---------------------------- | :------------ | :------------------- |
| Summary                       | `primarySoft` | `primary`            |
| Log                           | `mint`        | `success`            |
| Food                          | coral tint    | `accent`             |
| Patterns                      | lavender tint | `lavender`           |
| More (Report, Link, Settings) | yellow tint   | `highlight`          |

Option 2 keeps teal for every section: colour only in icons, answer pills and charts. New colours must be added to `theme.ts` and to `contrast.test.ts`, never written inline.

## Parts

- **Banner** (top of each screen): rounded sticker with the drawn section icon, title and a short subtitle, filled with the section colour.
- **Settings gear:** round 48px sticker, top right of every parent screen except Settings. Scrolls with the page, hidden when printing.
- **Card:** surface fill, ink outline and shadow; a header strip in the section colour with the title.
- **Answer pill:** small rounded label for what the family entered (mint good, yellow mixed, coral harder). The label always says it in words, colour is never the only signal.
- **Buttons:** main action in the section's strong colour, secondary on surface, destructive in `urgent`. One main action per screen.
- **Floating tab bar** (`ParentNav`): rounded tray 12px above the bottom edge and 10px from the sides, five tabs (Summary, Log, Food, Patterns, More). The active tab is a pill with an ink outline. More opens a floating sheet with Doctor report, Family link, Lock and Back to child mode. The bar appears only after the PIN and never on setup. Hidden when printing.
- **Icons:** drawn in the style of `CheckInIcons`: 2.4px navy stroke, round caps, flat fills from the theme. Decorative (`aria-hidden`), the label is next to them.

## Rules

- Back navigation lives in the tab bar; do not add "Back to parent summary" links.
- On a parent-only phone (`deviceRole === "parent"`) never show "Back to child mode".
- Keep the wording of `docs/PRODUCT.md` section 6: no medical claims, no scores, no alarming colours for the child's answers.
- A screen with a table or chart still fits 360px wide with no sideways scroll; tablets use the wider column from the responsive task.
- Do not tap-highlight: `-webkit-tap-highlight-color: transparent` is global, keep `:focus-visible` outlines.
