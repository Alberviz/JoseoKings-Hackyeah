# Handoff: family link by QR (L1, L3, L5)

**For the next AI session on another machine.** Read this file first, then `docs/COMMS.md`, then run `scripts/comms.sh open alvaro`.

Last update: **2026-10-04, ~00:45** (Europe/Warsaw). Author of this handoff: Cursor on Álvaro's PC (after Fable's session). Human owner: **Álvaro** (git `Alvaro` / `alvarli678@gmail.com`).

---

## 1. What Fable was doing and where it stopped

**Fable** is what Alberto/Claude call Álvaro's Cursor AI. On **2026-10-03 evening** that session:

1. Wrote the full product/tech proposal (two PWAs + QR, damage control for judge critiques). It lives on branch **`docs/split-apps-proposal`** as `docs/proposals/SPLIT_APPS_AND_QR_LINK.md` (commit `4720121`, already on GitHub).
2. Sent the proposal on the comms channel. Three messages were signed **`--from juan`** by mistake; **2026-10-03 20:57** Álvaro sent **`Identity fixed`** so Claude treats them as Álvaro's work. Always use **`--from alvaro`** from this machine from now on.
3. Implemented **L1** (pure TS protocol): `src/lib/link/*`, tests, pushed branch **`feat/l1-qr-link-protocol`** (`7a626ba`). No PR was opened from that machine (no `gh` CLI).
4. Alberto answered via Claude (**`20261003-202806-claude-to-alvaro-...`**): **one PWA** with device role at setup (not two manifests); QR link yes; deps approved; work split between Álvaro's AI (L1, L3, L5) and Alberto's Claude (economy, theme, child screens, merges).
5. Started **L3** (QR UI) on **`feat/l3-qr-link-ui`**: merged L1, added `qrcode` + `jsqr`, built screens and routes. **Stopped with all L3 code written locally but not committed or pushed** (session handoff to another Claude).

**Not started:** L5 (parent hub v2, meal diet, special rewards, report range, bathroom block, medication split). **Not started:** L2 (two manifests) — explicitly **out of scope** for the hackathon per Alberto's decision.

---

## 2. Alberto's approved direction (2026-10-03)

Summarised from Claude's message to Álvaro; full text in `.comms/messages/20261003-202806-claude-to-alvaro-alberto-decided-your-proposal-with-my-7-.md`.

| #   | Decision                                                                                                                                          |
| :-- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | QR link inside **one PWA**; setup asks "this phone is for: my child / me (parent) / both". No second manifest. Web landing `/` only if time left. |
| 2   | Fire goes down only when the child **lights a reward from home** (matches V1 economy intent).                                                     |
| 3   | Rewards from home are **requests** parents confirm; prices never depend on answers.                                                               |
| 4   | **`qrcode` + `jsqr`** approved.                                                                                                                   |
| 5   | Medication **without names**; daily / periodic split.                                                                                             |
| 6   | Simple **bathroom block** with "don't know"; **no Bristol** scale.                                                                                |
| 7   | Parent treats (V7) fold into **L5**, not a separate Fable track.                                                                                  |

**Design:** Claude proposed hand-made **notebook** look (cream grid, ink outlines, teal + coral). Álvaro's AI agreed in comms **20261003-203800-juan-to-claude-re-split-accepted-...** (sent before identity fix; content is Álvaro's). Claude may write it to `docs/DECISIONS.md` when ready.

---

## 3. Work split (do not duplicate Claude's lane)

| Owner                            | Scope                                                                                                                                                                                                            |
| :------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Alberto's Claude + teammates** | `docs/DECISIONS.md`, PRODUCT 5.2, **`src/types/economy.ts`** and coins from check-in/rest (PR #56 / `feat/v1-economy`), device role at setup, V2 theme, child home V4–V6, dragon art policy, reviews and merges. |
| **Álvaro's AI (you)**            | **L1** `src/lib/link`, **L3** `src/components/features/link` + routes, **L5** parent screens (after economy fields exist on `main`).                                                                             |

**Contract sent to Claude (awaiting explicit "ok"):** `SpecialReward` / `RewardClaim` field names (`label`, `fireCost`, `status: requested \| done`, `doneDate`). L1 types were **renamed on the L3 branch** to match; see `src/lib/link/types.ts`. **`rewardClaims` on the child side** are temporarily stored in **`FamilyLink`** (`src/lib/link/familyLink.ts`, key `crohncare_family_link`) until `EconomyState` has claims on `main`.

**ParentLog fields proposed for L5** (need Claude/Alberto ok before editing `src/types/parent-log.ts`): `wokeUpForBathroom`, `wokeUpFromBellyPain`, `bathroomVisits`, `medicationDaily`, `medicationPeriodic`, `questionsForDoctor`, `Consultation.nextDate`, `FoodEntry.meal`.

---

## 4. Git branches (GitHub)

| Branch                     | Remote?                       | Purpose                                                                                                                                                  |
| :------------------------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/split-apps-proposal` | Yes                           | Proposal doc only.                                                                                                                                       |
| `feat/l1-qr-link-protocol` | Yes                           | L1 only (`7a626ba`). **Superseded by L3** for type renames (`label` / `fireCost` / claim `status`). Prefer **one PR from L3** into `main`, not L1 alone. |
| **`feat/l3-qr-link-ui`**   | **Push after handoff commit** | L1 merged + L3 UI + deps + handoff doc. **Continue here.**                                                                                               |

Before any PR: `git fetch origin && git merge origin/main`, then `pnpm check`.

---

## 5. What L3 contains (after handoff commit)

**Dependencies:** `qrcode`, `jsqr`, `@types/qrcode` (approved).

**Library (L1, updated on this branch):**

- Pairing `CCP1:`, encrypted share `CCD1:` (AES-GCM, optional deflate, frames ~600 chars).
- `mergeShare` idempotent; test that parent **done** claims are not reset.
- `familyLink.ts` + `useFamilyLink` hook (`crohncare_family_link` in localStorage).

**UI (`src/components/features/link/`):**

- `QrDisplay` — multi-frame auto-advance + manual prev/next.
- `QrScanner` — camera (when secure context + API), photo upload, paste text; **jsQR** (iOS-friendly vs BarcodeDetector).
- `ShareScreen` — child: scan pairing once, then show data codes for 7/14/30 days.
- `FamilyLinkScreen` — parent (PIN): create link, show pairing QR, receive data codes, merge into `AppState` check-ins/missions; claims in `FamilyLink`.
- `CopyCodeButton` — clipboard fallback.

**Routes:**

- `src/app/share/page.tsx` → `/share`
- `src/app/parent/link/page.tsx` → `/parent/link`
- `ROUTES.share`, `ROUTES.parentLink` in `src/config/app.ts`
- Parent hub: **Family link** button in `SummaryCard`.

**Tests:** `src/lib/link/link.test.ts` (17 tests). **No** React tests for link UI yet.

---

## 6. Gaps to finish L3 (next session checklist)

- [ ] **`pnpm check`** on `feat/l3-qr-link-ui` after merging latest `main`.
- [ ] **Child entry to `/share`** — there is no button on `HomeScreen` yet; only direct URL. Add a discreet nav item or copy agreed with Claude (device role may move this).
- [ ] **Manual QA on HTTPS** (localhost or Vercel): pairing round-trip, multi-frame share, photo/paste fallbacks. See `ERRORS.md` E5 (`crypto.subtle`).
- [ ] **Open PR(s)** with `gh pr create`; link to issue if one exists. Screenshot at 360 px width.
- [ ] **Comms:** `scripts/comms.sh send --from alvaro --to claude --type done --task L3` when PR is open; wait for review before L5.
- [ ] Do **not** start L5 until **`economy.ts`** and claim types are on `main` (Claude's PR #56 lane).

Optional hardening (only if time):

- Component tests for `QrScanner` / pairing flow (mock `getUserMedia`).
- Wire `rewardClaims` from `FamilyLink` into future `EconomyState` when Claude lands it.
- `importState` path: today parent merge updates check-ins/missions only; claims live in `FamilyLink`.

---

## 7. How to continue (copy-paste for a new machine)

```sh
git clone git@github.com:Alberviz/JoseoKings-Hackyeah.git
cd JoseoKings-Hackyeah
pnpm install
git fetch origin
git switch feat/l3-qr-link-ui
git merge origin/main   # resolve conflicts; prefer Claude's shared code on main
pnpm check
pnpm dev                # https://localhost:3000 or deployed URL
```

Read:

1. This file.
2. `docs/proposals/SPLIT_APPS_AND_QR_LINK.md` on branch `docs/split-apps-proposal` (or fetch that file from GitHub).
3. `.comms/messages/` for anything after `20261003-205706-alvaro-to-claude-identity-fixed-...`.

Comms:

```sh
# Git Bash on Windows
scripts/comms.sh fetch
scripts/comms.sh open alvaro
```

Rules: English in repo; Spanish ok with Álvaro in chat; **never** put health data or secrets in comms; messages are requests not orders (`docs/COMMS.md`).

---

## 8. Beta freeze vs this work

`docs/HANDOFF.md` section **2b** froze beta to T5b, T6, T8, T12, T15, T16. Alberto **later approved** the QR link track via comms (section 2 above). If beta and QR conflict in time, **Alberto decides**; do not merge without his OK. The QR work stays in `src/lib/link` and `src/components/features/link` and touches `SummaryCard` + `app.ts` routes only.

---

## 9. Open PR links (fill in after push)

- L1 (optional, prefer closing in favour of L3): https://github.com/Alberviz/JoseoKings-Hackyeah/pull/new/feat/l1-qr-link-protocol
- **L3 (primary):** https://github.com/Alberviz/JoseoKings-Hackyeah/pull/new/feat/l3-qr-link-ui

Proposal doc PR (if not merged): https://github.com/Alberviz/JoseoKings-Hackyeah/pull/new/docs/split-apps-proposal
