#!/usr/bin/env bash
set -euo pipefail

# Runs create -> issue -> activate -> transfer -> fulfill end to end against
# the ledger, and checks the observer never sees `amount`, so judges (or CI)
# can replay the full loop without the UI. See Tacet.Setup:demoFlow.

LEDGER_HOST="${LEDGER_HOST:-localhost}"
LEDGER_PORT="${LEDGER_PORT:-6865}"
DAR="${DAR:-.daml/dist/tacet-0.1.0.dar}"

daml script \
  --dar "$DAR" \
  --script-name Tacet.Setup:demoFlow \
  --ledger-host "$LEDGER_HOST" \
  --ledger-port "$LEDGER_PORT" \
  --upload-dar yes
