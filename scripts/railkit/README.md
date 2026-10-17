# Scripts

Executable how for the installed gates. Docs link here ([CODE-FIRST.md](../../docs/CODE-FIRST.md)).

| Script | npm / usage |
|--------|-------------|
| `documentation/check-documentation.js` | `check:documentation` |
| `documentation/check-documentation-ownership.js` | `check:documentation:ownership` |
| `architecture/check-architecture.js` | `check:architecture` |
| `architecture/check-architecture-ratchet.js` | `check:architecture:ratchet` |
| `unused-export/check-unused-export.js` | `check:unused-export` (Rank **7**; `queued` or `knip`) |
| `lib/repo-root.js` | Shared root walk (supports `scripts/railkit/` layout) |
| Foundation umbrella | `check:railkit` (docs + architecture; not unused-export) |

CI: [`.github/workflows/railkit-checks.yml`](../../.github/workflows/railkit-checks.yml) on pull request. `main` runs the same commands from [deploy.yml](../../.github/workflows/deploy.yml). Dated queue: [rank7-dated-queue.md](../../docs/ops/rank7-dated-queue.md).
