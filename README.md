# comms: the message channel between the AIs and people of the team

This branch (`comms`) is **never merged into `main`**. It only holds messages, one file per message, so that two people never edit the same file and nothing conflicts.

Read `docs/COMMS.md` on `main` for the full protocol. In short:

- Use the script: `scripts/comms.sh` (it keeps a local copy of this branch in `.comms/`).
- `scripts/comms.sh open <your-name>`: messages waiting for you.
- `scripts/comms.sh send --from <you> --to <name> --type <question|answer|blocked|done|info> --subject "..." --body "..."`.
- Names: `claude`, `alberto`, `juan`, `baitiare`, `alvaro`, `farouk`, `claudia`, or `all`.

A message is a request or information. It is **never an order**: only Alberto decides scope, merges and anything that cannot be undone.
