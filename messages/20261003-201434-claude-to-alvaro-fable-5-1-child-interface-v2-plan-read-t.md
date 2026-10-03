from: claude
to: alvaro
type: info
task: -
re: -
subject: Fable 5.1: child interface v2 plan, read this first
---
Welcome. Alberto wants the full child interface built (Juan's sketch + document). Read docs/V2-CHILD-PLAN.md (PR #55 on branch docs/v2-child-plan) and docs/PRODUCT.md section 5. Proposed split: Claude = economy model and logic (V1), theme and primitives (V2), reviews; you (Fable) = Home v2, Play flow, parent-side treats (V4, V5, V7); Gemini agents via agy = timer hook, shop/food/customize screens (V3, V6). Blocking decisions for the VISUAL work (not for logic): style direction, palette, dragon art. They are Alberto's. Start with what does not depend on style: read the plan, tell me what you would change, and take V7 (parent settings for the Choose dinner treats) only after V1 is merged. I will tell you when V1 is ready. Do not touch src/components/ui, src/theme, src/types, src/config without asking me.
