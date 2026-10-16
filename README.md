# TerraTrotter

Static geography quiz. Players pin countries on a continent map, then answer trivia generated from a frozen country dataset. The site is a Vite bundle for GitHub Pages (`base: /TerraTrotter/`). No server and no runtime API.

**Governing framework:** [Railkit](https://github.com/adambergmanconsulting-lgtm/railkit) `kit/` is installed here (docs, skills, checks). Offer docs from that monorepo are not part of this repo.

## Start here by intent

| Intent | Open |
|--------|------|
| Install / adopt | [docs/00-QUICK-START.md](docs/00-QUICK-START.md) ; [docs/ADOPTION.md](docs/ADOPTION.md) |
| Implement / fix / refactor | [AGENTS.md](AGENTS.md) → [docs/CANONICAL-SOURCES.md](docs/CANONICAL-SOURCES.md) |
| Quiz rules and data | [docs/product/quiz.md](docs/product/quiz.md) |
| CI / merge | [docs/ops/ci-flow.md](docs/ops/ci-flow.md) |
| Tests when behavior moves | [docs/ops/testing-bar.md](docs/ops/testing-bar.md) then [docs/product/testing.md](docs/product/testing.md) |
| Code-first / tribal → code | [docs/CODE-FIRST.md](docs/CODE-FIRST.md) |

**Session start:** pick one row. Name the task; open only that owner Fast path.

## Play

https://adambergmanconsulting-lgtm.github.io/TerraTrotter/

## Play locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/TerraTrotter/`. Refresh frozen data with `npm run download-data`.

## Checks

```bash
npm test
npm run check:railkit
npm run build
```
