#!/usr/bin/env bash
# Message channel between the AIs and people of the team. See docs/COMMS.md.
# Messages live on the `comms` branch (never merged), one file per message, in a local copy at .comms/.
set -euo pipefail

BRANCH="comms"
LOCAL="comms-local"
ROOT="$(git rev-parse --show-toplevel)"
DIR="$ROOT/.comms"
NAMES="claude alberto juan baitiare alvaro farouk claudia all"

die() { echo "comms: $*" >&2; exit 1; }

ensure_copy() {
  git -C "$ROOT" fetch -q origin "$BRANCH" || die "cannot fetch origin/$BRANCH"
  if [ ! -e "$DIR/.git" ]; then
    git -C "$ROOT" worktree prune
    git -C "$ROOT" worktree add -q -B "$LOCAL" "$DIR" "origin/$BRANCH" || die "cannot create $DIR"
  fi
  git -C "$DIR" pull -q --rebase origin "$BRANCH" || die "cannot update the local copy"
}

valid_name() { for n in $NAMES; do [ "$n" = "$1" ] && return 0; done; return 1; }

# Value of a front-matter field (first lines of a message file).
field() { sed -n "1,12s/^$2: //p" "$1" | head -1; }

cmd_send() {
  local from="${COMMS_NAME:-}" to="" type="info" task="-" re="-" subject="" body=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --from) from="$2"; shift 2 ;;
      --to) to="$2"; shift 2 ;;
      --type) type="$2"; shift 2 ;;
      --task) task="$2"; shift 2 ;;
      --re) re="$2"; shift 2 ;;
      --subject) subject="$2"; shift 2 ;;
      --body) body="$2"; shift 2 ;;
      *) die "unknown option $1" ;;
    esac
  done
  [ -n "$from" ] || die "--from (or COMMS_NAME) is required"
  valid_name "$from" || die "unknown sender '$from' (use: $NAMES)"
  valid_name "$to" || die "unknown recipient '$to' (use: $NAMES)"
  case "$type" in question|answer|blocked|done|info) ;; *) die "--type must be question, answer, blocked, done or info" ;; esac
  [ -n "$subject" ] || die "--subject is required"
  if [ -z "$body" ] && [ ! -t 0 ]; then body="$(cat)"; fi
  [ -n "$body" ] || die "--body is required (or pipe the text on stdin)"

  ensure_copy
  local stamp slug file
  stamp="$(date -u +%Y%m%d-%H%M%S)"
  slug="$(printf '%s' "$subject" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9' '-' | sed 's/--*/-/g; s/^-//; s/-$//' | cut -c1-40)"
  file="messages/${stamp}-${from}-to-${to}-${slug}.md"
  {
    echo "from: $from"
    echo "to: $to"
    echo "type: $type"
    echo "task: $task"
    echo "re: $re"
    echo "subject: $subject"
    echo "---"
    printf '%s\n' "$body"
  } > "$DIR/$file"

  git -C "$DIR" add "$file"
  # The comms branch has no code, so the code hooks (lint-staged) do not apply: HUSKY=0 skips them.
  HUSKY=0 git -C "$DIR" commit -q -m "docs(comms): $from to $to, $type" || die "commit failed"
  for attempt in 1 2 3; do
    if git -C "$DIR" push -q origin "$LOCAL:$BRANCH" 2>/dev/null; then echo "sent: $file"; return 0; fi
    git -C "$DIR" pull -q --rebase origin "$BRANCH" || die "cannot rebase before pushing"
  done
  die "push failed after 3 tries (the message is committed locally in .comms/)"
}

# Messages addressed to a name (or to all) that no other message answers yet.
cmd_open() {
  local me="${1:-${COMMS_NAME:-}}"
  [ -n "$me" ] || die "usage: comms.sh open <name>"
  valid_name "$me" || die "unknown name '$me'"
  ensure_copy
  local found=0 f base to
  for f in "$DIR"/messages/*.md; do
    [ -e "$f" ] || continue
    base="$(basename "$f")"
    to="$(field "$f" to)"
    { [ "$to" = "$me" ] || [ "$to" = "all" ]; } || continue
    [ "$(field "$f" from)" = "$me" ] && continue
    if grep -lq "^re: $base$" "$DIR"/messages/*.md 2>/dev/null; then continue; fi
    found=1
    echo "=== $base"
    echo "from: $(field "$f" from) | type: $(field "$f" type) | task: $(field "$f" task)"
    echo "subject: $(field "$f" subject)"
  done
  [ "$found" = 1 ] || echo "no open messages for $me"
}

cmd_read() {
  [ $# -ge 1 ] || die "usage: comms.sh read <file name>"
  ensure_copy
  cat "$DIR/messages/$(basename "$1")"
}

cmd_log() {
  ensure_copy
  ls -1 "$DIR"/messages/*.md 2>/dev/null | tail -"${1:-20}" | while read -r f; do
    echo "$(basename "$f")  [$(field "$f" type)] $(field "$f" subject)"
  done
}

# Prints a line every time a new message for <name> arrives. Meant to run in the background.
cmd_watch() {
  local me="${1:-${COMMS_NAME:-}}" every="${2:-30}"
  [ -n "$me" ] || die "usage: comms.sh watch <name> [seconds]"
  local seen=""
  while true; do
    ensure_copy
    for f in "$DIR"/messages/*.md; do
      [ -e "$f" ] || continue
      local base to
      base="$(basename "$f")"
      to="$(field "$f" to)"
      { [ "$to" = "$me" ] || [ "$to" = "all" ]; } || continue
      [ "$(field "$f" from)" = "$me" ] && continue
      case " $seen " in *" $base "*) continue ;; esac
      seen="$seen $base"
      echo "NEW $base | from $(field "$f" from) | $(field "$f" type) | $(field "$f" subject)"
    done
    sleep "$every"
  done
}

case "${1:-help}" in
  send) shift; cmd_send "$@" ;;
  open) shift; cmd_open "$@" ;;
  read) shift; cmd_read "$@" ;;
  log) shift; cmd_log "$@" ;;
  watch) shift; cmd_watch "$@" ;;
  *) cat <<USAGE
usage:
  scripts/comms.sh open <name>                 messages waiting for you
  scripts/comms.sh read <file>                 read one message
  scripts/comms.sh send --from <you> --to <name> --type <question|answer|blocked|done|info> \\
                        --subject "..." --body "..." [--task T5] [--re <file being answered>]
  scripts/comms.sh log [n]                     last n messages
  scripts/comms.sh watch <name> [seconds]      print a line when a new message arrives
names: $NAMES
USAGE
  ;;
esac
