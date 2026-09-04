# Tablewaii — oRPC + enumwaii

Tablewaii is a contract-first restaurant reservation service with a host-stand UI.

Run: pnpm --dir examples/orpc dev

Reservations are grouped by lunch or dinner and move through REQUESTED, CONFIRMED, SEATED, COMPLETED, NO_SHOW, and CANCELLED. The exhaustive .deriveTo() graph means a host cannot seat a cancelled party or mark an unseated party complete. Every successful action includes the x-actor host name in its audit trail; stale writes return typed VERSION_CONFLICT data.

reservations.availability deliberately accepts and returns an enumwaii scalar Standard Schema. Request and transition procedures compose the same status into Zod contracts through zodSchema.

Validate: pnpm --dir examples/orpc test; pnpm --dir examples/orpc test:types; pnpm --dir examples/orpc build
