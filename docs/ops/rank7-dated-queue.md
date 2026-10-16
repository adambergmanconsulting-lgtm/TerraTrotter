# Rank 7 dated queue

**Purpose:** Ideal instruments for TerraTrotter that are not on the foundation umbrella yet. Each row has an owner and a due date.

## Fast path (read first)

- One row per instrument.
- Owner + due required.
- Slipped dates re-enter the working loop ([ADOPTION.md](../ADOPTION.md#gradual-change)).

| Instrument | Serves ranks | Owner | Due (YYYY-MM-DD) | Status |
|------------|--------------|-------|------------------|--------|
| Unused-export / Knip-class | 4, 6, 7 | host-maintainer | 2026-12-16 | queued |
| Browser e2e on the CI umbrella | 2, 4, 7 | host-maintainer | 2026-12-16 | queued |
| Living design page | 7 | host-maintainer | 2026-12-16 | queued |

Unit proof for scoring, trivia, and map clip is `npm test` (shipped). UI copy follows [ui-principles.md](../product/heuristics/ui-principles.md) on the quiz shell. Vendor assert/apply does not apply: there is no paid vendor portal.

Yardstick: [governing-priorities.md](governing-priorities.md). Mechanical unused-export gate: `npm run check:unused-export`.
