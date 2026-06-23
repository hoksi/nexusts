# Publishing NexusTS packages to npm

This directory documents how the 31 NexusTS packages get published to
the public npm registry.

## Documents

| File | Audience | Covers |
|------|----------|--------|
| [workflow.md](./workflow.md) | Maintainers | How the GitHub Actions workflow publishes (release vs. manual trigger) |
| [local-publish.md](./local-publish.md) | Maintainers | How to run `bun run publish:all` from your machine |
| [npm-rate-limit.md](./npm-rate-limit.md) | Everyone | The 25/24h publish rate limit — what to do when you hit it |
| [troubleshooting.md](./troubleshooting.md) | Maintainers | Common failures (429, EOTP, E401) and how to recover |
| [first-time-setup.md](./first-time-setup.md) | First-time maintainer | How to set up the npm org, token, GitHub secret |

## TL;DR for the impatient

```bash
# Build everything
bun run build

# Publish (idempotent: skips already-published versions)
bun run publish:all
```

Or trigger the GitHub Actions workflow:

- **Auto**: push a release tag (`gh release create v0.7.7`)
- **Manual**: GitHub → Actions → "Publish packages to npm" → Run workflow

## Why monorepo publishing is tricky

NexusTS ships as **30 independent npm packages** under `@nexusts/*`,
plus the `create-nexusts` scaffolder. That means a single release is
30+ `npm publish` calls. npm's anti-abuse system flags a burst of 30
publishes from a brand-new org as suspicious, so we hit
[rate limits](./npm-rate-limit.md) on the very first release.

The solutions documented here:

- `publish.ts` is **idempotent** — re-running it only retries missing
  versions, not all 30.
- The CI workflow supports a **`publish-batch`** mode that adds a
  10-minute break every 5 packages.
- Local publish always uses **`npm login --auth-type=web`** so 2FA is
  handled via the browser, not via pasted OTPs.
