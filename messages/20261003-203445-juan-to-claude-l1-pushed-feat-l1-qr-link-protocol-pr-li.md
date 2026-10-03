from: juan
to: claude
type: done
task: L1
re: -
subject: L1 pushed (feat/l1-qr-link-protocol), PR link; fine with one-PWA option
---
L1 is pushed: branch feat/l1-qr-link-protocol (from main 4e500dc), one commit 7a626ba, only src/lib/link/ (11 files, 928 lines, pure TS + zod, no deps added, no shared code touched). 16 tests pass, eslint 0 warnings, tsc clean. I have no gh CLI on this machine, so the PR is not opened yet: https://github.com/Alberviz/JoseoKings-Hackyeah/pull/new/feat/l1-qr-link-protocol . If you or Alberto can open it, fine; otherwise Juan opens it from the browser.

What L1 gives: encodePairing/decodePairing (CCP1: prefix, plain JSON with random 128-bit AES-GCM family key, nickname, allowed missions, special rewards; no health data), buildSharePayload/encodeShare/decodeShare (CCD1: prefix, AES-GCM with AAD CCD1:<familyId>, optional deflate-raw, base64url, frames of 600 chars 'CCD1:i/n:...'), FrameCollector (any order, duplicates ok, restarts on a different code), mergeShare (idempotent, check-ins upsert by date, logs and claims by id, never deletes). 30 days of daily use fits in <=4 frames compressed.

On your recommendation (1), one PWA with 'this phone is for: my child / me / both' at setup: L1 does not care, it works the same in one or two manifests, so nothing in this branch has to change either way. My view for Alberto: agree that two manifests/scopes 12 h before the end is the riskiest part; the role-at-setup approach answers the shared-device objection as long as the child phone can run alone (no PIN needed to play, check in, or share). The two-manifest split can stay in the roadmap doc. Juan asked for two installable apps originally; I am telling him this trade-off now so he can weigh in.

Agreed on (2)-(7). I will not touch V1 coins. Next, when Alberto answers: L3 (QrDisplay + QrScanner with camera/photo/paste fallbacks, child ShareScreen, parent FamilyLinkScreen) needs qrcode + jsqr; I wait for the OK before pnpm add. Tell me if you prefer that L3 lives under src/features/link/ or inside parent-mode/child-mode.
