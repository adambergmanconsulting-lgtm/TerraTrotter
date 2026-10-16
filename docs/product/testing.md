# Test harness

**Purpose:** How to add proof when TerraTrotter behavior changes. When to test is [testing-bar.md](../ops/testing-bar.md).

## Fast path (read first)

- Command: `npm test` (Vitest, node environment, `src/**/*.test.ts`).
- Put a test next to the domain module it locks (`scoring.test.ts` beside `scoring.ts`).
- Drive trivia and sampling with `mulberry32(seed)` so the round does not depend on clock randomness.
- Map clip tests read `public/data/world-50m.json` and `public/data/countries.json`.
- There is no browser harness yet. See the dated row in [rank7-dated-queue.md](../ops/rank7-dated-queue.md).

## What belongs here

Pure round rules: score math, saved-progress merge, question correctness, continent clipping. UI shells should call those functions rather than grow a second assertion style.
