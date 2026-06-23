# First-time publish setup

If you're reading this, you're probably about to publish NexusTS
to npm for the first time. This walks through everything you need
to set up before the first `npm publish` succeeds.

## 1. Create the @nexusts npm org

This only needs to be done once, by whoever owns the NexusTS
project.

1. Go to <https://www.npmjs.com/org/create>
2. Create an org with the slug `nexusts` (matches the GitHub
   org `kabyeon/nexusts`)
3. In the org settings, add the maintainer accounts that will
   own the 31 packages

## 2. Reserve the 31 package names

NexusTS publishes 30 packages under `@nexusts/*` plus
`create-nexusts` (without scope). Each name must be reserved on
the registry before the first publish.

The names that need to be created (in publish order):

**Framework (30)**:

```
@nexusts/core @nexusts/cli @nexusts/view
@nexusts/auth @nexusts/cache @nexusts/config
@nexusts/crypto @nexusts/drive @nexusts/drizzle
@nexusts/events @nexusts/graphql @nexusts/grpc
@nexusts/health @nexusts/i18n @nexusts/limiter
@nexusts/logger @nexusts/mail @nexusts/metrics
@nexusts/openapi @nexusts/queue @nexusts/redis
@nexusts/resilience @nexusts/schedule @nexusts/session
@nexusts/shield @nexusts/sse @nexusts/static
@nexusts/tracing @nexusts/upload @nexusts/ws
```

**Scaffolder (1)**:

```
create-nexusts
```

When you `npm publish` for the first time, npm creates the
package name automatically. So no manual reservation is needed
beyond making sure the 30 org-scoped names and the one
unscoped name are not already taken.

> Note: if any of the `@nexusts/*` names are already taken (e.g.
> by a previous fork or typo squat), you'll need to rename that
> package. The `name` field is in `packages/<name>/package.json`.

## 3. Enable 2FA on the publish account

npm requires 2FA to publish. WebAuthn (biometric / security key) is
recommended over TOTP (authenticator app) for a better device-flow
experience with npm 11+.

1. Go to <https://www.npmjs.com/settings/kabyeon/two-factor>
2. Enable "Authenticator app" (TOTP) or "Security key / Biometric"
   (WebAuthn)
3. Save the recovery codes somewhere safe (password manager)

## 4. Mint an npm Automation token

Two options:

### Option A: Local-only publishing (recommended for now)

You don't need a token — `npm login --auth-type=web` stores the
session token in `~/.npmrc`. This is what [local-publish.md](./local-publish.md)
walks through.

### Option B: CI publishing via GitHub Actions

1. Go to <https://www.npmjs.com/settings/kabyeon/tokens>
2. Click "Generate New Token"
3. Set Type: **Automation** (CI/CD; bypasses 2FA but respects rate
   limits)
4. Set expiry: 90 days (the maximum for Automation tokens)
5. Copy the generated `npm_xxxxx...` token immediately — npm
   shows it only once

Then in GitHub:

1. Go to <https://github.com/kabyeon/nexusts/settings/secrets/actions>
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Secret: paste the `npm_xxxxx...` token
5. Click "Add secret"

Verify it's wired up correctly:

```bash
gh secret list --repo kabyeon/nexusts
# Should show: NPM_TOKEN  Updated 2026-XX-XX
```

## 5. Verify the org scope for scoped packages

If you're publishing under `@nexusts/*` and your account is a
member of the org, you should be able to publish. Verify:

```bash
npm access ls-packages @nexusts
# Should list all 30 packages (or be empty before first publish)
```

If you get `npm ERR! 404 Not Found - 'kabyeon' is not in the
'nexusts' org`, you need to be added to the org first.

## 6. Dry-run the workflow before going live

Before doing a real release, run the GitHub Actions workflow in
`dry-run` mode to make sure everything is wired up:

1. Go to <https://github.com/kabyeon/nexusts/actions>
2. Click "Publish packages to npm" → "Run workflow"
3. Mode: `dry-run` (default)
4. Click "Run workflow"

The job should succeed in about 60 seconds and print:

```
✓ packages/auth//package.json
✓ packages/cache//package.json
... (29 more)
```

If any of the `✓` lines is replaced with a syntax error, the
`package.json` for that package is malformed and the publish
will fail. Fix it before triggering a real publish.

## 7. The first real publish

You have two options.

### Option A: First release via GH Actions

```bash
git tag v0.7.7
git push origin v0.7.7
gh release create v0.7.7 --generate-notes
```

Watch the workflow at <https://github.com/kabyeon/nexusts/actions>.
If it fails with 429 after ~25 packages (see
[npm-rate-limit.md](./npm-rate-limit.md)), wait 24h and re-run
with `mode: publish`.

### Option B: First release from your machine

```bash
# Login (one time per machine)
npm login --auth-type=web

# Build + publish
bun run build
bun run publish:all
```

If the first 25 succeed and the next 6 fail with 429, you can re-run
`bun run publish:all` after 24h. The script skips already-published
versions automatically.

## After first publish

- Add the `NPM_TOKEN` secret to the GitHub repo so future releases
  can be triggered from CI (see step 4).
- Document any org-specific decisions (token rotation policy,
  who can trigger releases, etc.) in your team's runbook.
- If you want a `v0.7.x` release cadence, consider adopting
  [Changesets](https://github.com/changesets/changesets) before
  the next major version bump — see
  [npm-rate-limit.md](./npm-rate-limit.md#long-term-direction-changesets).
