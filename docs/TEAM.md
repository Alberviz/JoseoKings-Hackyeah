# Team and working agreements

Who is who, how each person works with an AI tool, and the few habits that keep seven people (and several AIs) from stepping on each other. Tasks and owners are in [`TASKS.md`](TASKS.md).

---

## Start of every AI session (all tools, all people)

Paste this as your first message to Claude Code, Gemini CLI, Antigravity or any other assistant, and fill in the task:

```text
Read AGENTS.md, docs/PRODUCT.md, docs/ARCHITECTURE.md and the section of my task in docs/TASKS.md.
I am <name> and my task is <T#>. Work only in the folders of that task, on its own branch.
Follow the component pattern (.tsx + .style.ts), use the theme and src/components/ui.
Never add medical advice, health data sent to a server, or a dependency that is not listed.
If something is unclear or needs a file outside my folders, stop and ask me.
Read docs/COMMS.md and run `scripts/comms.sh open <my name>`: that is how you ask Claude and the other AIs questions.
```

`CLAUDE.md` and `GEMINI.md` already import `AGENTS.md`, which points to the other documents, so Claude Code and Gemini load them automatically. Other tools do not: use the prompt above.

## Roles

| Person       | Role                                                                                                                                                                       |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Alberto**  | Product owner. Approves scope. Reviews and merges every PR. Owns the data logic and the demo QA.                                                                           |
| **Claude**   | Lead engineer with Alberto. Owns shared code, architecture, rules and reviews. Talks to Alberto in Spanish; all repo text is English.                                      |
| **Juan**     | Data layer, patterns logic, doctor report.                                                                                                                                 |
| **Baitiare** | Frontend: companion, child home, missions, companion extras.                                                                                                               |
| **Álvaro**   | Check-in flow and parent mode screens. Helps Farouk with the clinical content.                                                                                             |
| **Farouk**   | Clinical content and sources, patterns screen. **Splits and sequences work**: keeps the issue board current, spots blockers, redistributes small tasks, with Alberto's OK. |
| **Claudia**  | Submission PDF (at most 10 slides), pitch, demo script, README, AI disclosure, sources list.                                                                               |

## Clinical content rules (Farouk, Álvaro, and anyone writing copy)

- You are the people who make the content true. Every question, mission and sentence about health has a **source** in a comment, or the comment `// source: to verify`.
- You can say what the app records. You cannot say what it does to the body.
- If you are not sure a phrase is a medical claim, assume it is, and write the descriptive version ("the family logged"). See `PRODUCT.md` sections 5.4 and 6.
- Anything about exercise safety for children with IBD must be reviewed by you two before it reaches the UI. If you doubt a mission, remove it from `src/content/missions.ts`.

## Working with an AI if you are not a software engineer

- Describe the task and paste the start prompt above. Ask the AI to explain what it changes, in plain words.
- Run `pnpm check` before you push. If it fails, paste the error to the AI; do not skip it.
- Never accept "I'll disable the lint rule" or "I'll add `any`". Those are forbidden in `AGENTS.md`.
- If the AI wants a new dependency, a change in `src/types`, `src/theme` or `src/components/ui`, stop and ask Claude or Alberto.

## Habits

1. **One task, one branch, one PR.** Small commits. Conventional Commits.
2. **Build against types and mocks.** Do not wait for another task to merge.
3. **Ask early, in the issue.** A question in the issue is cheaper than a rewrite.
4. **Checkpoints** are fixed in `TASKS.md`. At each one, post three lines in the team chat: done, next, blocked.
5. **Errors** that take more than 10 minutes go to `ERRORS.md` (append only).
6. **Nobody but Alberto merges.** Nobody but Alberto and Claude pushes to `main`, and only for hotfixes.
7. **Be honest in the demo.** If something is simulated or demo data, the demo says so.
