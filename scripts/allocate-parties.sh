#!/usr/bin/env bash
set -euo pipefail

# Allocates the Issuer / Holder / Observer demo parties, and creates the
# issuer's IssuerRole contract, against whatever ledger LEDGER_HOST/
# LEDGER_PORT point at. Defaults to the local `daml start` sandbox.

LEDGER_HOST="${LEDGER_HOST:-localhost}"
LEDGER_PORT="${LEDGER_PORT:-6865}"
DAR="${DAR:-.daml/dist/tacet-0.1.0.dar}"

daml script \
  --dar "$DAR" \
  --script-name Tacet.Setup:setup \
  --ledger-host "$LEDGER_HOST" \
  --ledger-port "$LEDGER_PORT" \
  --upload-dar yes
