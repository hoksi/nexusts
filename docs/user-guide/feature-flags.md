# `@nexusts/feature-flag` — Feature flags

Canary deployments, A/B testing, and gradual rollout — a first-party
feature flag module.

```ts
import { FeatureFlagModule, FeatureFlagService, FeatureFlag } from '@nexusts/feature-flag';

@Module({
  imports: [
    FeatureFlagModule.forRoot({
      flags: {
        'new-dashboard': { enabled: true, rollout: 0.5 },
        'beta-api':      false,
      },
    }),
  ],
})
class AppModule {}
```

---

## 1. Install

```bash
bun add @nexusts/feature-flag
```

Zero external dependencies — the default `memory` backend runs
in-process.

---

## 2. Module registration

```ts
FeatureFlagModule.forRoot({
  flags: {
    // Boolean shorthand: true = { enabled: true }, false = { enabled: false }
    'maintenance-mode': false,

    // Full definition
    'new-checkout': {
      enabled: true,
      rollout: 0.2,                  // active for 20% of traffic
      allowlist: ['internal-qa'],    // always enabled for these IDs
      denylist:  ['banned-tenant'],  // always disabled for these IDs
    },
  },
})
```

---

## 3. FeatureFlagService API

```ts
@Controller('/api')
class ApiController {
  constructor(
    @Inject(FeatureFlagService.TOKEN) private flags: FeatureFlagService,
  ) {}

  @Get('/info')
  async info(c: Context) {
    const ctx = { userId: c.var.user?.id };
    const showBeta = await this.flags.isEnabled('new-checkout', ctx);
    return c.json({ beta: showBeta });
  }
}
```

| Method | Description |
| ------ | ----------- |
| `isEnabled(flag, context?)` | `Promise<boolean>` — `true` if the flag is active |
| `setFlag(name, definition)` | Add or update a flag at runtime |
| `getFlag(name)` | Return the current definition (`undefined` if missing) |
| `applyDecorators(instance)` | Wire `@FeatureFlag` metadata onto an instance |

---

## 4. `@FeatureFlag` decorator

Gate a route handler directly:

```ts
@Controller('/dashboard')
class DashboardController {
  constructor(
    @Inject(FeatureFlagService.TOKEN) private flags: FeatureFlagService,
  ) {}

  @Get('/')
  @FeatureFlag('new-dashboard')          // returns 404 JSON when disabled
  async index(c: Context) {
    return c.json({ page: 'new-dashboard' });
  }
}
```

The container automatically calls `applyDecorators(controller)` after
instantiation. You can call it manually too:

```ts
this.flags.applyDecorators(myController);
```

### Options

```ts
@FeatureFlag('new-dashboard', {
  // Extract FlagContext from Hono Context
  contextFn: (c) => ({ userId: c.var.user?.id }),

  // Custom response when disabled
  onDisabled: (c) => c.json({ message: 'Coming soon' }, 503),
})
async index(c: Context) { ... }
```

---

## 5. Flag evaluation rules

| Rule | Priority | Description |
| ---- | -------- | ----------- |
| `denylist` | 1 (highest) | Always disabled if context matches |
| `allowlist` | 2 | Always enabled if context matches |
| `enabled: false` | 3 | Flag is off |
| `rollout` | 4 | 0-1 fractional rollout via djb2 hash bucketing |
| Default | 5 (lowest) | Enabled if `enabled: true` |

`rollout` uses `context.userId → context.tenantId → context.key` as
the hash seed (first non-empty wins). Same userId always gets the
same result (sticky bucketing).

---

## 6. Runtime flag manipulation

```ts
// Gradually increase rollout during deployment
flags.setFlag('new-checkout', { enabled: true, rollout: 0.8 });

// Emergency disable
flags.setFlag('new-checkout', false);

// Check current definition
console.log(flags.getFlag('new-checkout'));
// → { enabled: false }
```

---

## 7. FlagContext type

```ts
interface FlagContext {
  userId?:     string;
  tenantId?:   string;
  key?:        string;  // fallback hash seed when userId/tenantId absent
  attributes?: Record<string, unknown>;  // for custom backends
}
```

---

## 8. Custom backends

Implement `FeatureFlagBackend` to integrate with LaunchDarkly,
Unleash, or any remote service:

```ts
import type { FeatureFlagBackend, FlagContext, FlagDefinition } from '@nexusts/feature-flag';

class LaunchDarklyBackend implements FeatureFlagBackend {
  constructor(private client: LDClient) {}

  async isEnabled(flagName: string, context?: FlagContext): Promise<boolean> {
    return this.client.variation(flagName, { key: context?.userId ?? 'anonymous' }, false);
  }

  setFlag() { /* no-op for remote backend */ }
  getFlag() { return undefined; }
}
```

In v0.8 only the `memory` backend ships as first-party. LaunchDarkly
and Unleash adapters are on the v0.9 roadmap.

---

## 9. See also

- [`./cross-cutting-features.md`](./cross-cutting-features.md) — cache, shield, limiter
- [`../analysis/nestjs-comparison.md`](../analysis/nestjs-comparison.md) §5.2 — feature flag gap analysis
- [LaunchDarkly Node.js SDK](https://docs.launchdarkly.com/sdk/server-side/node-js)
- [Unleash Node.js SDK](https://docs.getunleash.io/reference/sdks/node)
