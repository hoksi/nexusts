# GitHub Actions publish workflow

The workflow at `.github/workflows/publish.yml` is the primary
publish path for NexusTS releases.

## Triggers

| Event | Behavior |
|-------|----------|
| `release: published` | Auto-publish on every GitHub release. Use this for normal version cuts. |
| `workflow_dispatch` (manual) | Manual run from the Actions tab. Choose a `mode` input. |

## Modes (workflow_dispatch input)

| Mode | What it does | When to use |
|------|--------------|-------------|
| `publish` | Real publish, 30s between packages. Idempotent: re-runs only retry missing versions. | A normal release tag. |
| `publish-batch` | Real publish, 10-minute break every 5 packages. Slower but less likely to trip npm's anti-abuse heuristics. | First-ever release of 30+ packages from a new org. |
| `dry-run` (default) | Validate that every `packages/*/package.json` parses. No registry interaction. | Verifying the workflow before a real release. |
| `build` | Run `bun run build:all` only. No publish, no validation. | Debugging the build step. |

## What each mode actually runs

All modes share these steps:

1. `actions/checkout@v4` — clone the repo
2. `oven-sh/setup-bun@v2` — install Bun 1.3.x
3. `actions/setup-node@v4` — install Node 20 (registry URL configured)
4. `bun install --no-frozen-lockfile` — install monorepo dependencies
5. `bun run build:all` — build all 30 packages into `packages/*/dist/`

After that:

- **`publish` / `publish-batch`** runs `bun run scripts/publish.ts`
  with the appropriate `PUBLISH_BATCH_*` env vars set.
- **`dry-run`** validates 31 package.json files.
- **`build`** stops here.

## Runner

```yaml
runs-on: ubuntu-22.04
timeout-minutes: 180
```

`ubuntu-22.04` is used because the default `ubuntu-latest` /
`ubuntu-24.04` runner IP pools share addresses that the npm registry
flagged as suspicious after the v0.7.0 burst publish. `ubuntu-22.04`
routes through a different IP pool.

`timeout-minutes: 180` is enough for a `publish-batch` run: 30 packages
× 10 minutes per batch break (6 breaks) + build time + retry
slack. A normal `publish` run completes in well under 10 minutes
because the idempotent skip means only the missing packages take
time.

## Required secrets

- `NPM_TOKEN` — npm Automation token, set in
  Repository → Settings → Secrets and variables → Actions.

The workflow exposes the token as `NODE_AUTH_TOKEN` in the publish
step, and `publish.ts` reads it from either `NPM_TOKEN` or
`NODE_AUTH_TOKEN`. See [first-time-setup.md](./first-time-setup.md)
for how to mint this token.

## Triggering a release

The cleanest workflow for a normal release is:

```bash
# 1. Make sure all your commits are pushed
git push origin main

# 2. Create a release tag + GitHub release
gh release create v0.7.7 \
  --title "v0.7.7" \
  --generate-notes

# 3. Watch the workflow run
gh run list --workflow=publish.yml --limit 3
```

The release event fires the `release: published` trigger, which runs
the `publish` step. The script skips already-published versions and
publishes only what changed.

## Manually re-running a failed publish

If the auto-publish run hit npm's rate limit (see
[npm-rate-limit.md](./npm-rate-limit.md)):

1. Wait the suggested cooldown (24h for the 25/24h limit, or
   1-2 hours for transient IP rate limits).
2. From the Actions tab: "Publish packages to npm" → Run workflow
   → Mode: `publish` → Run.
3. The script will only retry the missing packages.

If you want to be extra safe, use Mode: `publish-batch` instead of
`publish` for the retry — it adds 10-minute breaks every 5 packages.
