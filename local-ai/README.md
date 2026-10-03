# Local AI squad (Álvaro lane)

Cursor Lead ↔ agy coordinate via files. VAPEXPERIENCE only makes creative calls (Spanish). Repo copy stays English.

## Roles

| Role    | Who           | Channel                                               |
| :------ | :------------ | :---------------------------------------------------- |
| Human   | VAPEXPERIENCE | Cursor Lead only                                      |
| Lead    | Cursor Lead   | `ASSIGNED.md` + `BUS.md` + official COMMS as `alvaro` |
| Builder | agy           | only `ASSIGNED.md` + `BUS.md`                         |

## Protocol

1. Lead writes work in `ASSIGNED.md` (`status: GO`).
2. agy reads ASSIGNED (sticky prompt: `agy-prompt.md`), implements, sets `DONE`, logs in `BUS.md`.
3. Lead reviews; opens next `GO` or sets `WAIT`.
4. Alberto / Claude: official `scripts/comms.sh` (`docs/COMMS.md`), not this folder.

Optional: `powershell -File local-ai\watch-assigned.ps1` and `comms-watch.ps1`.

## Files

| File                 | Role                                               |
| :------------------- | :------------------------------------------------- |
| `ASSIGNED.md`        | Current order (`GO` / `WAIT` / `DONE` / `BLOCKED`) |
| `BUS.md`             | Short log Lead ↔ agy                               |
| `STATUS.md`          | done / next / blocked for humans                   |
| `agy-prompt.md`      | Paste once into Antigravity                        |
| `watch-assigned.ps1` | Notify when ASSIGNED/BUS change                    |
| `comms-watch.ps1`    | Poll official COMMS for `alvaro`                   |

## Scope reminder

- Feature folders only (see `docs/TASKS.md`). Shared UI/theme needs Alberto OK.
- Check-in content ids: `belly-comfort`, `energy`, `play-pace` (scale 0–2). No Mario IP. Theme tokens only.
- Beta freeze: no new features outside the beta list.
