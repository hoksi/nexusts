# Publishing from your local machine

Use this when the CI workflow can't reach npm (e.g. you're inside a
private network, or the GH Actions runner IP is rate-limited).

## Prerequisites

1. You must be a maintainer of the `@nexusts` npm org
   (<https://www.npmjs.com/settings/teams/org/nexusts/teams>).
2. You must have **2FA enabled** on your npm account. Both TOTP
   (authenticator app) and WebAuthn (biometrics / security key) work.
3. You need a recent `bun` (≥ 1.3.0).

## Login (one time per machine)

```bash
npm login --auth-type=web
```

This command triggers npm 11+'s device authorization flow:

1. npm prints a URL like
   `https://www.npmjs.com/auth/cli/132ed4f2-79ee-40a7-826f-e0f00c7c3b6d`.
2. Press ENTER to open it in your browser.
3. Log in (if you aren't already), complete 2FA, and complete
   the WebAuthn / biometric check.
4. npm stores the resulting token in `~/.npmrc`.

You should see `npm whoami` return your username after this.

## Run the publish script

From the repo root:

```bash
# Build everything
bun run build

# Publish. Idempotent: skips versions already on the registry.
bun run publish:all
```

`publish.ts` reads the token from `~/.npmrc`, runs `npm view` to
check what's already published, and then runs `npm publish` for the
remaining packages with `--access public`.

### How `publish.ts` decides what to publish

For each of the 31 packages, in this order:

1. Run `npm view <name>@<version> version` to check the registry.
2. If it returns the same version → skip (already published).
3. Otherwise → publish with the 2FA flow inherited from your
   `npm login`.

This means a fresh first-time publish will try all 31 packages, and
a re-run after a partial failure will only touch the missing ones.

### What you'll see during a fresh first-time publish

```
[publish] ↷ @nexusts/auth@0.7.0 already published; skipping
... (25 packages already on npm)
[publish] → @nexusts/sse@0.7.0
[publish] ✓ @nexusts/sse@0.7.0
[publish] → @nexusts/static@0.7.0
[publish] ✓ @nexusts/static@0.7.0
... (6 fresh publishes)
```

When a publish triggers npm 11's 2FA device flow, you'll see
something like:

```
Authenticate your account at:
https://www.npmjs.com/auth/cli/ec06263c-4e4a-4076-ba78-d65d91711ff7
Press ENTER to open in the browser...
```

Press ENTER. Your browser opens the URL, you complete 2FA +
biometric, and npm continues the publish automatically. The token
is cached for the rest of the session, so subsequent publishes in
the same run won't re-prompt unless the token expires.

## If you hit the npm rate limit

If you see `429 Too Many Requests` mid-run:

- The script backs off (60s, then 120s) and retries up to 3 times.
- If all 3 retries fail, the script moves on to the next package.
- Wait **at least 24 hours** after publishing the bulk (25+) before
  trying again — see [npm-rate-limit.md](./npm-rate-limit.md).

## Other useful scripts

```bash
# Re-run only the missing packages with a 10-min break every 5
bun run publish:batch

# Validate package.json files only (no publish)
bun run publish:dry-run

# Build only, no publish at all
bun run build
```

## Why we use `npm login --auth-type=web`

Older instructions say to pass `--otp=123456` to every `npm publish`
command. With npm 11, this no longer works:

- TOTP codes rotate every 30 seconds, so passing them in scripts is
  racy.
- WebAuthn / biometric factors don't have a numeric code at all.

`npm login --auth-type=web` opens a browser once, the token you get
back is good for the rest of the session, and `npm publish` will
trigger the device flow automatically each time the token expires.

If you prefer to manage your own automation, mint an **Automation**
token at <https://www.npmjs.com/settings/kabyeon/tokens> (Type:
Automation, not Publish). Automation tokens bypass 2FA but still
require the npm rate limit to be respected.
