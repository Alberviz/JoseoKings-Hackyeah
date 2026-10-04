#!/usr/bin/env bash
# Message channel between the AIs and people of the team. See docs/COMMS.md.
# Backed by GitHub Issues (Inboxes #70-#75, #99 + broadcast #76).
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  if [ -x "/c/Program Files/GitHub CLI/gh.exe" ]; then
    export PATH="$PATH:/c/Program Files/GitHub CLI"
  fi
fi

if [ -z "${GH_TOKEN:-}" ]; then
  GH_TOKEN="$(printf "protocol=https\nhost=github.com\n" | git credential fill 2>/dev/null | grep -E "^password=" | cut -d= -f2- || true)"
  if [ -n "$GH_TOKEN" ]; then
    export GH_TOKEN
  fi
fi

NAMES="claude alberto-cerebro lead-ai alberto alberto-obrero obrero juan alvaro baitiare farouk claudia all broadcast"
REPO="Alberviz/JoseoKings-Hackyeah"

die() { echo "comms: $*" >&2; exit 1; }

valid_name() { for n in $NAMES; do [ "$n" = "$1" ] && return 0; done; return 1; }

name_to_issue() {
  case "$1" in
    alberto|alberto-cerebro|lead-ai|claude) echo "70" ;;
    alberto-obrero|obrero) echo "99" ;;
    alvaro|alvaro-ai) echo "71" ;;
    juan|juan-ai) echo "72" ;;
    baitiare|baitiare-ai) echo "73" ;;
    farouk|farouk-ai) echo "74" ;;
    claudia|claudia-ai) echo "75" ;;
    all|broadcast) echo "76" ;;
    *) echo "" ;;
  esac
}

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

  local issue_id
  issue_id="$(name_to_issue "$to")"
  [ -n "$issue_id" ] || die "no issue configured for recipient '$to'"

  local words
  words="$(printf '%s' "$body" | wc -w)"
  if [ "$words" -gt 50 ]; then
    echo "comms: notice: body is $words words (>50). Follow telegraphic protocol: max 1-2 lines to save tokens." >&2
  fi

  local re_tag=""
  if [ "$re" != "-" ] && [ -n "$re" ]; then
    re_tag=" (re: $re)"
  fi

  local payload
  payload="[$from -> $to][$type][$task] $subject$re_tag: $body"

  gh issue comment "$issue_id" -R "$REPO" -b "$payload" >/dev/null || die "failed to post comment to issue #$issue_id"
  echo "sent to #$issue_id ($to): $payload"
}

cmd_open() {
  local me="${1:-${COMMS_NAME:-}}"
  [ -n "$me" ] || die "usage: comms.sh open <name>"
  valid_name "$me" || die "unknown name '$me'"

  local issue_id
  issue_id="$(name_to_issue "$me")"
  [ -n "$issue_id" ] || die "no inbox issue found for '$me'"

  echo "=== [INBOX #$issue_id for $me] ==="
  local inbox_comments
  inbox_comments="$(gh issue view "$issue_id" -R "$REPO" --json comments --jq '.comments[-5:][] | "\(.createdAt[11:16]) [\(.author.login)]: \(.body)"' 2>/dev/null || true)"
  if [ -n "$inbox_comments" ]; then
    echo "$inbox_comments"
  else
    echo "no recent messages in your inbox"
  fi

  if [ "$issue_id" != "76" ]; then
    echo "=== [BROADCAST #76 (all)] ==="
    local broadcast_comments
    broadcast_comments="$(gh issue view 76 -R "$REPO" --json comments --jq '.comments[-3:][] | "\(.createdAt[11:16]) [\(.author.login)]: \(.body)"' 2>/dev/null || true)"
    if [ -n "$broadcast_comments" ]; then
      echo "$broadcast_comments"
    else
      echo "no broadcast messages"
    fi
  fi
}

cmd_read() {
  local target="${1:-76}"
  local issue_id
  issue_id="$(name_to_issue "$target")"
  if [ -z "$issue_id" ]; then
    issue_id="$target"
  fi
  gh issue view "$issue_id" -R "$REPO" --comments
}

cmd_log() {
  local limit="${1:-5}"
  echo "=== Recent Broadcast (#76) ==="
  gh issue view 76 -R "$REPO" --json comments --jq ".comments[-$limit:][] | \"\\(.createdAt[11:16]) [\\(.author.login)]: \\(.body)\"" 2>/dev/null || true
}

# Number of comments of issue $1; prints nothing when gh fails (transient error).
watch_count() {
  gh issue view "$1" -R "$REPO" --json comments --jq '.comments | length' 2>/dev/null || true
}

# Prints every comment of issue $2 after the first $3, one NEW MESSAGE style line each.
# Prints nothing and never fails when gh errors out.
watch_print_new() {
  gh issue view "$2" -R "$REPO" --json comments \
    --jq ".comments[$3:][] | \"$1 [#$2] \\(.createdAt[11:16]) [\\(.author.login)]: \\(.body)\"" 2>/dev/null || true
}

cmd_watch() {
  local me="${1:-${COMMS_NAME:-}}" every="${2:-30}"
  [ -n "$me" ] || die "usage: comms.sh watch <name> [seconds]"
  valid_name "$me" || die "unknown name '$me'"
  case "$every" in ''|*[!0-9]*) die "seconds must be a positive number" ;; esac
  [ "$every" -gt 0 ] || die "seconds must be a positive number"
  local inbox
  inbox="$(name_to_issue "$me")"
  [ -n "$inbox" ] || die "no inbox issue found for '$me'"

  echo "Watching inbox #$inbox for $me every ${every}s"

  # Counts start empty: the first successful read only sets the baseline.
  # A failed gh call leaves the baseline untouched, so nothing is lost or repeated.
  local inbox_last="" bcast_last="" count=""
  while true; do
    count="$(watch_count "$inbox")"
    if [ -n "$count" ]; then
      if [ -n "$inbox_last" ] && [ "$count" -gt "$inbox_last" ]; then
        watch_print_new "NEW MESSAGE" "$inbox" "$inbox_last"
      fi
      inbox_last="$count"
    fi
    if [ "$inbox" != "76" ]; then
      count="$(watch_count 76)"
      if [ -n "$count" ]; then
        if [ -n "$bcast_last" ] && [ "$count" -gt "$bcast_last" ]; then
          watch_print_new "BROADCAST" 76 "$bcast_last"
        fi
        bcast_last="$count"
      fi
    fi
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
  scripts/comms.sh open <name>                 messages waiting in your inbox + broadcast
  scripts/comms.sh read <name|issue>           read conversation of an inbox issue
  scripts/comms.sh send --from <you> --to <name> --type <question|answer|blocked|done|info> \\
                        --subject "..." --body "..." [--task T5] [--re <id>]
  scripts/comms.sh log [n]                     last n broadcast messages
  scripts/comms.sh watch <name> [seconds]      background monitor: prints each new inbox/broadcast message

names & inboxes:
  alberto-cerebro, lead-ai, claude, alberto -> #70
  alberto-obrero, obrero                     -> #99
  alvaro, alvaro-ai                          -> #71
  juan, juan-ai                              -> #72
  baitiare, baitiare-ai                      -> #73
  farouk, farouk-ai                          -> #74
  claudia, claudia-ai                        -> #75
  all, broadcast                             -> #76
USAGE
  ;;
esac
