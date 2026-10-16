# CI flow

**Purpose:** Mental model for cheap local checks → clean-room CI → release. Commands live in `package.json` and workflows ([CODE-FIRST.md](../CODE-FIRST.md)).

## Fast path (read first)

- **Local:** `npm run check:railkit`
- **CI:** [`.github/workflows/railkit-checks.yml`](../../.github/workflows/railkit-checks.yml) runs the same script
- **Skill:** `ci-gate` — what to run when merge fails or before push
- **Do not:** invent remote-only gates that humans cannot run locally

## Mental model

| Stage | Role |
|-------|------|
| **Editor / pre-commit (optional)** | Fast lint or staged checks; wire Husky later ([scripts/ci/README.md](../../scripts/ci/README.md)) |
| **Local package scripts** | Doc ownership + file-size ratchets (budgets that only get stricter) first (`check:railkit`); unused-export / Knip-or-equivalent via `check:unused-export` as Rank **7** on the same umbrella when ready |
| **CI workflow** | Clean-room confirmation of the same scripts |
| **Release** | Host-defined; skill `release` points here after the host fills the section |

## Host fill-in

- **Branch:** `main` deploys GitHub Pages via [deploy.yml](../../.github/workflows/deploy.yml).
- **Local:** `npm test`, then `npm run check:railkit`, then `npm run build`.
- **CI:** [railkit-checks.yml](../../.github/workflows/railkit-checks.yml) runs `npm test` and `npm run check:railkit` on push and pull request. Deploy runs those, then `npm run build`.
- **E2E:** no browser job yet. The dated row is in [rank7-dated-queue.md](rank7-dated-queue.md).

**Trend gates / tests:** instruments (checks/tools that serve a rank) of [governing-priorities.md](governing-priorities.md). Adopt order and customer depth: [ADOPTION.md](../ADOPTION.md#correct-sequence), [testing-bar.md](testing-bar.md).

## Prefer / Avoid

| Prefer | Avoid |
|--------|--------|
| One host umbrella that matches laptop commands | Divergent CI and laptop commands |
| Rank **1**–**2** held before chasing Rank **7** instruments | Skipping owners to wire Knip or showy e2e jobs first |
| CI as how Rank **3**/**4** bind every editor | Treating CI jobs as goals above situating (opening the one right owner doc before edit) |
| Unit + e2e as Rank **2** proof vehicles | Merging behavior changes with red or skipped tests |
| Path-triggered heavy jobs when the host grows | Running the universe on every docs typo |
| Resume from a named gate after a green prefix | Re-running hours of green work without a resume story |
