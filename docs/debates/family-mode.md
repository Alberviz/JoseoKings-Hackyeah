# Debate: family mode (parent app and child app)

Status: **open**. Decision owner: **Alberto**. Nothing in this file is a decision until Alberto writes it in `docs/DECISIONS.md`.

---

## Protocol (read before writing a turn)

1. Work only on branch `debate/family-mode`. Never touch `main`, code, or any file other than this one.
2. Each turn is **one new section at the end** of this file, titled `## Turn N · <author> · <date>`.
3. **Never edit a previous turn.** If you were wrong, say so in your next turn.
4. Each turn: at most 400 words. Start with a short answer to the open questions of the previous turn: **Accept**, **Reject**, or **Ask**. Then give your argument.
5. Commit only this file, with the message `docs(debate): turn N <short summary>`. Our commit hook rejects other prefixes.
6. Stop after **6 turns** (3 per side), or when anyone writes `STOP` in a turn. Then Claude writes a final **summary turn** with agreements, disagreements, and decisions that Alberto must take.
7. No turn may propose code that is committed to `main`, and no turn may propose a demo that simulates a feature without saying so in the demo script.

### How to take part (for each AI and each person)

```sh
git fetch origin
git switch debate/family-mode
git pull --ff-only
# read this file, append ONE turn, then:
git add docs/debates/family-mode.md
git commit -m "docs(debate): turn N <short summary>"
git push origin debate/family-mode
```

---

## Context

- App for people with Crohn's disease. Team of 6, HackYeah 2026, 24 hours. Judges score originality (30%), alignment with the challenge (20%), working implementation (25%), viability (15%), pitch (10%).
- Team rules in `AGENTS.md`: health data stays on the device, no medical diagnosis or treatment advice, accessibility is part of the product.
- Proposal under discussion: a **parent app** and a **child app** that connect, for children with Crohn's (7-15 years).
- Teammate research (for reference): branch `feature/product-innovation-crohn`, files `docs/product.md` and `research/`.

---

## Turn 0 · Claude (assistant of Alberto) · 2026-10-03

**Position A (Claude):**

- The child device stores **no health data**. Only a routine checklist with generic labels ("Task 1", "Task 2").
- The parent app does **not** receive location or medication status in the demo.
- No symptom data anywhere in family mode.
- The two devices connect with a **QR handshake**, with no server and no account:
  1. The parent app shows a QR with the routine.
  2. The child app scans it and stores it locally.
  3. When a task is done, the child app shows a QR with the confirmation.
  4. The parent app scans it.
- The demo uses **two real phones**. If any part is simulated, the demo script says so.

**Position B (Gemini, round 1 on the other side):**

- No health data from the child, but the parent receives "medication taken" and the child's location in an emergency.
- Connection by WebRTC, with a signalling server on Vercel. Real networking to be cut in 24 hours.
- For the demo, simulate the connection with both apps on the same device.

**Open questions for the other side:**

1. Is "medication taken" health data under GDPR, given that it reveals the child's treatment? Argue your answer.
2. Can the QR handshake carry all the routine data without a server? What is the maximum size of a QR that a phone can scan reliably? How do we avoid exposing medication names to anyone who photographs the screen?
3. What is the smallest demo that shows two real devices working? If a simulation is acceptable, what must the demo script say?
4. At what age should the child app become the owner of its own profile? Justify with the legal framework you know, and say what you are not sure of.
5. How does this map to a partner challenge? Name one challenge and one judging criterion, and say how the family mode serves them.

Reply in your next turn.
