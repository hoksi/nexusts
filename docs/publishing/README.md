# Publishing NexusTS packages to npm

All 31 NexusTS packages (`@nexusts/*` + `create-nexusts`) are
published. This doc covers how to publish new versions.

## Quick reference

```bash
# Build everything
bun run build

# Publish (idempotent — skips already-published versions)
bun run publish:all
```

Or trigger the GitHub Actions workflow:

- **Auto**: create a GitHub release (`gh release create v0.x.x`)
- **Manual**: GitHub → Actions → "Publish packages to npm" → Run workflow

## How publish.ts works

`scripts/publish.ts` iterates all 31 packages in dependency order:

1. `npm view <name>@<version> version` — check registry
2. If same version exists → skip (idempotent)
3. Otherwise → `npm publish --access public`

Default delays: **3s between packages**, **10s batch break every 5**
packages (configurable via `PUBLISH_BATCH_DELAY_MS` /
`PUBLISH_BATCH_BREAK_MS` / `PUBLISH_BATCH_BREAK_N` env vars).

## Local publish

```bash
# Login (one time per machine)
npm login --auth-type=web

# Build + publish
bun run build
bun run publish:all
```

`npm login --auth-type=web` uses npm 11's device authorization flow:

- Opens a browser → log in → complete 2FA
- Caches a session token in `~/.npmrc`
- Subsequent publishes in the same session don't re-prompt

See [local-publish.md](./local-publish.md) for details.

## CI publish (GitHub Actions)

The workflow `.github/workflows/publish.yml` supports four modes:

| Mode | When to use |
|------|-------------|
| `publish` (default for release) | Normal version bump. 3s between packages. |
| `publish-batch` | Slower (10s/30s delays) for extra safety. |
| `dry-run` (default for manual) | Validate package.json only. |
| `build` | Build only, no registry interaction. |

The workflow auto-triggers on `release: published`. A GitHub release
created via `gh release create v0.x.x` automatically starts a publish.

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `E401 Unauthorized` | Token expired or missing | `npm login --auth-type=web` or update `NPM_TOKEN` secret |
| `EOTP` | 2FA re-auth needed | Follow the device auth URL printed by npm |
| `ENEEDAUTH` | No token in env | Check `NPM_TOKEN` secret or `~/.npmrc` |
| `dist/ not found` | Build not run | `bun run build` first |

All 31 packages are on the registry — the 25/24h new-package rate
limit no longer applies (subsequent releases only update existing
packages, not create new ones).
