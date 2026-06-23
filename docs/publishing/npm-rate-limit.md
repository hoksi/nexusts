# npm publish rate limit

The npm public registry has a per-user, per-24-hour cap on **new
package publishes**. The exact number is not in any public
documentation, but is reported in the wild at around **25 new
packages per 24 hours** for new accounts / orgs.

## What the error looks like

When you exceed it:

```
npm error code E429
npm error 429 Too Many Requests - PUT
  https://registry.npmjs.org/<scope>%2f<name>
npm error Could not publish, as user undefined: rate limited exceeded
```

The `user undefined` part is intentional — npm hides the exact
counter (per-user vs per-IP vs per-org) to make the limit harder to
game.

References: [npm/cli#8507](https://github.com/npm/cli/issues/8507),
[StackOverflow: npm publish 429 Too Many
Requests](https://stackoverflow.com/questions/75973455/npm-publish-429-too-many-requests).

## Why it hits monorepos hard

NexusTS releases 30+ packages per release. The very first release
(v0.7.0, June 2026) hit this limit:

- 25 packages published successfully
- 6 packages (sse, static, tracing, upload, view, ws) returned
  `429 Too Many Requests` and failed

Subsequent releases (v0.7.x → v0.7.y) are unaffected because
they only update **existing** packages, not create new ones — the
limit is on *new* package creation, not on version updates.

## What we have in place to handle this

### Idempotent publish script

`scripts/publish.ts` checks the registry before each package:

```ts
// For every package:
const check = spawnSync("npm", ["view", `${name}@${version}`, "version"]);
// if check.status === 0: already published → skip
// else: npm publish --access public
```

So when you re-run after the 24h cooldown, the 25 packages that
already shipped are skipped, and only the 6 missing ones get
re-attempted. A 6-package publish is well under the 25/24h limit.

### GitHub Actions: `publish-batch` mode

`workflow_dispatch` with `mode: publish-batch` adds a 10-minute
break every 5 packages. Less critical now that we know the real
limit is daily rather than per-IP, but useful insurance for
future fresh-org releases.

See [workflow.md](./workflow.md) for the full workflow reference.

### Re-run after cooldown

```bash
# 24 hours after the last bulk publish
cd /Users/kabyeon/dev/ai_work/kimi-test/nexusjs
bun run publish:all
```

This will publish only the missing 6 packages. The whole operation
should take 1-2 minutes.

## Operational guidance

| Scenario | Action |
|----------|--------|
| First release of 30+ packages from a new org | Expect to hit the limit. Plan to publish the first ~20 over 24h, then the rest the next day. |
| Subsequent releases (existing packages only) | No risk. The limit is on *new* packages. |
| You hit 429 mid-release | Stop. Wait 24h. Re-run. `publish.ts` is idempotent. |
| You publish more than 25 in 24h anyway | The 26th through Nth will fail with 429. Recovery is the same: wait 24h, re-run. |

## What we considered but rejected

### OIDC trusted publishers

npm supports [OIDC trusted
publishers](https://docs.npmjs.com/trusted-publishers) so CI
providers (GitHub Actions, GitLab CI) can publish without a
long-lived token. **This does not bypass the rate limit** — it
just removes the 2FA step. So it doesn't help us.

### Granular access tokens

You can mint a token scoped to specific packages. Useful for
allowing CI to publish only certain packages. But the rate limit
applies per-user, not per-token, so this also doesn't help.

### Using multiple npm accounts

Theoretically possible. Practically a maintenance nightmare and
risks getting both accounts banned.

## Long-term direction: Changesets

[Changesets](https://github.com/changesets/changesets) is the
de-facto standard for multi-package monorepos:

- Version bumps are driven by `.changeset/*.md` files, not edited
  by hand.
- `changeset publish` publishes only the changed packages.
- It can be configured to batch and resume on failures.

Once NexusTS has a stable package set and we move to a regular
release cadence, adopting Changesets will:

- Make version management automatic (one PR → multiple package
  version bumps)
- Avoid the manual `bun run publish:all` step
- Make the 24h limit a non-issue (we'd only publish 1-3 changed
  packages per release)

This is on the roadmap but not urgent — the idempotent publish
script already handles the v0.7.0 incident correctly.
