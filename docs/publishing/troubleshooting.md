# Troubleshooting npm publish failures

A reference of the errors you'll actually see, and what to do about
them.

## E429 — Too Many Requests

**Symptom**:

```
npm error code E429
npm error 429 Too Many Requests - PUT
  https://registry.npmjs.org/<scope>%2f<name>
npm error Could not publish, as user undefined: rate limited exceeded
```

**Cause**: Either the 25/24h per-user new-package limit, or a
per-IP anti-abuse limit hit by the GitHub Actions runner pool.

**Fix**:

- If from a fresh release of 30+ packages: wait 24h, re-run.
- If from a single-package publish via GH Actions: see
  [npm-rate-limit.md](./npm-rate-limit.md).
- If persistent across all IPs: contact `support@npmjs.com`.

`publish.ts` already retries 3 times (60s, 120s) on 429.

## EOTP — One-time password required

**Symptom** (npm 11+):

```
npm notice Publishing to https://registry.npmjs.org/ with tag latest and public access
npm error code EOTP
npm error This operation requires a one-time password.
npm error Open this URL in your browser to authenticate:
npm error   https://www.npmjs.com/auth/cli/132ed4f2-79ee-40a7-826f-e0f00c7c3b6d
```

**Cause**: The npm account has 2FA enabled, and the publish needs
re-authentication. With npm 11, this is the **device authorization
flow**, not a 6-digit code.

**Fix**:

1. The URL `https://www.npmjs.com/auth/cli/...` is a one-time
   device code (expires in 30-60 seconds).
2. If you ran `npm publish` directly, press ENTER to open the
   URL in your browser. Log in, complete 2FA, complete the
   WebAuthn / biometric check. The publish will continue
   automatically.
3. If you ran it through `bun run publish:all` and the
   script's `stdio: "inherit"` wasn't applied, the URL is
   captured in the stderr buffer but the user can't see it.
   In that case, run the publish manually for the failed
   package: `cd packages/<name> && npm publish --access public`.

The right way to set this up for repeated publishes is
`npm login --auth-type=web` once — it caches a token for the
session so subsequent publishes don't re-prompt. See
[local-publish.md](./local-publish.md).

## E401 — Unauthorized

**Symptom**:

```
npm error code E401
npm error 401 Unauthorized - GET https://registry.npmjs.org/-/whoami
```

**Cause**: The token in `~/.npmrc` is expired, revoked, or never
existed.

**Fix**:

1. `npm login --auth-type=web` — re-authenticate and refresh the
   token in `~/.npmrc`.
2. If the publish script is running in CI, check that the
   `NPM_TOKEN` secret in the GitHub repo is still valid (not
   revoked from the npm web UI). If it is, mint a new one
   and update the secret.

## ENEEDAUTH — Run as logged-in user

**Symptom**:

```
npm error code ENEEDAUTH
npm error need auth This command requires you to be logged in to https://registry.npmjs.org/
```

**Cause**: `npm publish` was run without any token in scope.
Usually means `NPM_TOKEN` was empty in the GitHub Actions env.

**Fix**:

- For local: `npm login` (or check `~/.npmrc` exists with a valid
  token).
- For CI: check that the repo's `NPM_TOKEN` secret is set
  (Settings → Secrets → Actions). The workflow file uses
  `secrets.NPM_TOKEN` as the source.

## E404 — Package not found

**Symptom**:

```
npm error code E404
npm error 404 Not Found - PUT https://registry.npmjs.org/<scope>%2f<name>
```

**Cause**: You don't have permission to publish under that
scope. The `kabyeon` account may not be a member of the `@nexusts`
org, or the org's package scope settings exclude your account.

**Fix**:

- Verify `npm access ls-packages @nexusts` lists the package
  you're trying to publish. If not, ask the org owner to add
  you.
- Or check the org's team membership: `npm access ls-packages
  @nexusts/<package>`

## The script publishes 0 packages and reports failure

**Symptom**: `publish.ts` reports `done: 0 succeeded, N failed`
even though you expected it to publish.

**Cause**: All packages were either skipped (idempotent check
found them already published) or rejected. Check the output
for the per-package status lines (`✓` or `✖`).

**Fix**: Read the per-package errors. The most common is 429.

## The script exits with `no NPM_TOKEN in environment`

**Symptom**: The script prints `✖ no NPM_TOKEN in environment` and
exits non-zero.

**Cause**: `NPM_TOKEN` (or `NODE_AUTH_TOKEN`) is not set. This
should not happen in CI (the workflow sets `NODE_AUTH_TOKEN`), but
happens if you run `bun run publish:all` in a fresh shell.

**Fix**: Either:

- Re-run in a shell that has the token (CI does this
  automatically).
- Export the token manually:
  `NPM_TOKEN=$(grep _authToken ~/.npmrc | sed 's/.*=//') bun run
  publish:all`

## The build doesn't produce `dist/`

**Symptom**: `publish.ts` complains that `dist/index.js` doesn't
exist for some package.

**Cause**: `bun run build` wasn't run, or it failed for that
package. Check `packages/<name>/dist/` exists.

**Fix**:

- Run `bun run build` from the repo root. The output should say
  `[build] done: 60 runtime files written` (2 per package × 30
  packages).
- If a single package fails to build, look at the `[build]
  building @nexusts/<name>…` line for that package and read the
  error.

## "Cannot find module '@nexusts/core/...'"

**Symptom**: `bun run build` or `bun run test` fails with a
module resolution error for one of the internal packages.

**Cause**: A source file has a wrong import path. In the
monorepo, packages should import each other using
`@nexusts/<name>` (resolved via `bun`'s workspace protocol),
**not** via relative paths like `../../<other>/src/...`.

**Fix**:

- The most common offender is a freshly-added cross-module
  import. Search for `from "\.\./\.\./[a-z]+-` in `packages/`
  and replace with `from "@nexusts/<name>"`.
- After fixing, re-run `bun install` and `bun run build` to
  refresh the cache.
