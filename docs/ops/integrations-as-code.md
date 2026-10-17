# Integrations as code

**Purpose:** Apply [CODE-FIRST.md](../CODE-FIRST.md) to hosting, DNS, edge, and vendor wiring. Console clicks are debt unless a contract and script point at them.

## Fast path (read first)

- Put desired state in a contract or workflow. This repo uses [deploy.yml](../../.github/workflows/deploy.yml).
- Prefer assert/apply scripts under `infra/scripts/` when a vendor portal exists.
- Docs explain why and link; they do not replace the contract.
- During adopt: list portal-only steps; script them or give them an owner and due date ([ADOPTION.md](../ADOPTION.md)).

## Prefer / Avoid

| Prefer | Avoid |
|--------|--------|
| Versioned hosting/DNS/env contract | "We configured it in the console once" |
| Scripts that assert required env keys / hostnames | Runbooks that only list clicks with no assert |
| Secrets in the secret store; names in the contract | Secrets committed to git |
| One vendor integration owner module or script folder | Copy-pasted curl snippets in three READMEs |

## Example

No hosting contract is in this repo. GitHub Pages deploy is [deploy.yml](../../.github/workflows/deploy.yml). Add `infra/contracts/` only if a DNS or vendor portal appears.
