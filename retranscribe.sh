#!/bin/bash
# Re-transcribe a session's stored audio with the best available model.
# Usage: ./retranscribe.sh <session-id>
set -euo pipefail

BASE="$(cd "$(dirname "$0")" && pwd)"
SESSION="$BASE/sessions/$1"
[ -d "$SESSION/audio" ] || { echo "no audio in $SESSION" >&2; exit 1; }

for m in ggml-large-v3-turbo.bin ggml-large-v3-turbo-q5_0.bin ggml-medium.bin ggml-small.bin; do
  if [ -f "$BASE/models/$m" ]; then MODEL="$BASE/models/$m"; break; fi
done
echo "model: $(basename "$MODEL")"

TITLE=$(sed -n 's/.*"title": "\(.*\)",/\1/p' "$SESSION/meta.json")
OUT="$SESSION/transcript.jsonl"
cp "$OUT" "$OUT.bak" 2>/dev/null || true
: > "$OUT"

LAST=""
for wav in "$SESSION"/audio/seg-*.wav; do
  seg=$(basename "$wav" .wav | sed 's/seg-0*//; s/^$/0/')
  text=$(whisper-cli -m "$MODEL" -f "$wav" -l auto -nt --no-prints \
    --prompt "$TITLE. ${LAST: -150}" 2>/dev/null | tr -d '\n' | sed 's/^ *//; s/ *$//')
  if [ -n "$text" ] && ! echo "$text" | grep -qE '^[\[\(][^\]\)]*[\]\)]$'; then
    LAST="$text"
    printf '{"seg":%s,"time":"%s","text":%s}\n' \
      "$seg" "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" \
      "$(printf '%s' "$text" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" >> "$OUT"
  fi
  echo "seg $seg done"
done
echo "rewrote $OUT (backup at $OUT.bak)"
