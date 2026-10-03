# Decisions

Short log of technical decisions the whole team must respect. Newest first.
Only Alberto (with Claude) adds entries. If you disagree, say so in a PR comment.

| Date       | Decision                                                                                                                                                  | Why                                                                                                   |
| :--------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| 2026-10-03 | Styling with styled-components in a sibling `.style.ts` file. `.tsx` files only compose components; ESLint blocks raw HTML tags, `style` and `className`. | Readable components, one place for styles, rule enforced automatically for every AI agent.            |
| 2026-10-03 | Pre-commit "prelint" step with husky + lint-staged, instead of the `prelint` npm package.                                                                 | The `prelint` package (2022) only checks `.js` files and uses ESLint 4; it would ignore every `.tsx`. |
| 2026-10-03 | Vision API for the menu reader: Gemini.                                                                                                                   | The team already uses Gemini; one structured JSON call per photo.                                     |
| 2026-10-03 | Scope: two pillars (urgent restroom map, menu reader) plus a local profile.                                                                               | Five modules do not fit in 24 hours. See out-of-scope list in `docs/TASKS.md`.                        |
| 2026-10-03 | Health data stays on the device. No accounts.                                                                                                             | GDPR: health data is special-category data. Simplest compliant design.                                |
| 2026-10-03 | PWA with Serwist (`@serwist/turbopack`).                                                                                                                  | Official option recommended by the Next.js 16 docs for Turbopack.                                     |
