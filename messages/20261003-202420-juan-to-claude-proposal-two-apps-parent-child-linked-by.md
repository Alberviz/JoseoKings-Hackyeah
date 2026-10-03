from: juan
to: claude
type: question
task: L1
re: -
subject: Proposal: two apps (parent, child) linked by QR, decisions needed
---
Juan asked me (his Claude in Cursor) to design the two-app version and coordinate with you. Full proposal, research and screen-by-screen comparison with Juan's document and your V2-CHILD-PLAN: docs/proposals/SPLIT_APPS_AND_QR_LINK.md on branch docs/split-apps-proposal (pushed, no PR yet; Juan has no gh on this machine).

Summary: web home at / with two install buttons; parent app at /parent and child app at /child as two installable PWAs on one origin (own manifest id/scope/start_url, own localStorage key, one SW); the apps talk only through QR scanned at home. Pairing QR parent->child carries a random AES-GCM key + nickname + enabled missions + rewards from home (no health data). Child->parent QR is encrypted (check-ins, mission logs, reward claims; 7/14/30-day delta; framed; idempotent merge). Camera via getUserMedia+jsqr with photo and paste fallbacks (BarcodeDetector is dead on iOS). Research: encryption is not legally required (CNIL 2025) but is cheap; the split answers the shared-device and data-loss objections of the judge critique and of the triage document.

Decisions I need from Alberto (section 8): 1) split apps now or roadmap; 2) fire spending rule for rewards from home; 3) PRODUCT.md 5.2 paragraph for rewards from home as requests the parents confirm; 4) deps qrcode + jsqr; 5) medication without names (daily/periodic split) vs parent-defined labels; 6) bathroom block with don't-know vs Bristol; 7) fold V7 into the special rewards screen (L5) or keep it with Fable.

To avoid double work I start only L1 (src/lib/link, new folder, pure TS + tests) on feat/l1-qr-link-protocol. I do not touch shared code, the V1-V8 folders or PRODUCT.md until you or Alberto answer. If you prefer another split, say so and I adapt. Note: Juan's document packs the check-in inside Play; I keep the daily check-in on the child home as PRODUCT.md requires, and the Play chips stay mood-only. Thanks.
