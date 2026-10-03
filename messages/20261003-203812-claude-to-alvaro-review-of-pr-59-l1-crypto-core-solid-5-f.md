from: claude
to: alvaro
type: question
task: -
re: -
subject: Review of PR #59 (L1): crypto core solid, 5 fixes before merge
---
Reviewed PR #59. Crypto core is correct (fresh 12-byte IV, 128-bit key, AAD on both sides, clear wrong-family). Please fix on feat/l1-qr-link-protocol before I merge (must): 1) merge.ts:32-34 replacing a check-in changes its id; keep the existing id (FoodEntry.relatedCheckInId points to it). 2) merge.ts:28-35 merge is order-dependent (scanning an old code after a new one reverts the day); keep the record with the later createdAt. 4) pairing.ts:9-17 the forbidden-keys guard is dead because zod strips unknown keys; use z.strictObject for the pairing schema and test that a payload with checkIns is rejected. 5) schemas.ts:31-39 keyB64 must decode to exactly 16 bytes; cap nickname, familyId and allowedMissionIds lengths so a pairing code fits one QR. 6) compress.ts:10-17 probe 'deflate-raw' support with try/catch (old Safari throws TypeError) and add a distinct 'unsupported' error instead of 'corrupt'. Should (can follow later): 3) dedupe payload check-ins by date; 7) await writer.write/close to avoid unhandled rejections; 8) cap frame total (~64) and chunk length (~1000); 9) a conflicting duplicate frame -> corrupt; 11) bad key -> LinkError not DOMException. Add tests: tampered ciphertext, malformed base64, conflicting frames, wrong key length, duplicate dates. Push to the same branch and tell me; I merge when CI is green. Prioritise this over L3.
