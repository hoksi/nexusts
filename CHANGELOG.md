# Changelog

All notable changes to NexusJS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> 한글로 작성된 문서가 필요하면 [`CHANGELOG.ko.md`](./CHANGELOG.ko.md)를 참고하세요.

---

## [0.3.0] — 2026-06-21

v0.3 is the **production-ready** milestone. Every "Tier 1" gap from
the NestJS / AdonisJS feature analyses is closed, and the default
ORM (Drizzle) is wired through every DB-dependent module.

### Added · Modules

The framework now ships **17 modules** (was 7 in v0.2). Every new
module is its own bundle entry point — install only what you use.

| Module | Bundle entry | Purpose |
| ------ | ------------ | ------- |
| `nexus/health` | `nexus/health` | Liveness / readiness / startup endpoints. Built-in indicators: memory, disk, HTTP, Drizzle DB probe. |
| `nexus/config` | `nexus/config` | Zod-validated configuration. Layered loading (process.env → `.env` → `load()` → schema). |
| `nexus/logger` | `nexus/logger` | Pino-backed structured logging. Pretty-print in dev, JSON in prod. Request-scoped via AsyncLocalStorage. |
| `nexus/static` | `nexus/static` | Static file serving with ETag, Range, path-traversal protection, MIME inference. |
| `nexus/limiter` | `nexus/limiter` | Rate limiting. 3 strategies (fixed / sliding / token-bucket) × 2 backends (memory / drizzle). |
| `nexus/shield` | `nexus/shield` | Security suite: CSRF (HMAC) + HSTS + CSP + X-Frame-Options + Referrer-Policy. |
| `nexus/cache` | `nexus/cache` | Application cache. Memory (LRU + TTL) and Drizzle backends. Real tag-based invalidation. |
| `nexus/drive` | `nexus/drive` | File storage abstraction. Memory / Local / S3 / R2 drivers. Signed URLs. |
| `nexus/mail` | `nexus/mail` | Outbound email. Null / File / SMTP transports. MJML rendering. |
| `nexus/drizzle` | `nexus/drizzle` | **Default ORM.** Drizzle ORM integration. 5 dialects (postgres / mysql / sqlite / bun-sqlite / d1). Lucid-equivalent API. |

### Added · Drizzle backends for existing modules

`nexus/session`, `nexus/health`, `nexus/limiter`, and `nexus/cache`
all gained Drizzle-backed backends, so a multi-pod deployment can
share state through any Drizzle-compatible database.

| Module | Drizzle backend |
| ------ | --------------- |
| `nexus/session` | `DrizzleSessionStorage` (`backend: 'database'`) |
| `nexus/health` | `DrizzleHealthIndicator` (`SELECT 1` probe) |
| `nexus/limiter` | `DrizzleRateLimitStorage` (all 3 strategies) |
| `nexus/cache` | `DrizzleCacheStore` (with tag index for `invalidateByTag`) |

### Added · CLI

- `nx make:model` and `nx make:migration` are now **dialect-aware**.
  Pass `--dialect postgres | mysql | sqlite | bun-sqlite | d1` to
  pick the right Drizzle import path and column types.
- **New command `nx migrate`** (`nx m`) — wraps `drizzle-kit
  migrate`, with `--status`, `--generate "<name>"`, `--folder`,
  `--dialect`, `--config` flags.
- `nx init` now scaffolds a `drizzle.config.ts` automatically when
  `--orm drizzle` is selected.
- `nx info` prints the resolved `dialect` field.

### Added · Lucid gap closure (AdonisJS comparison)

`nexus/drizzle` closes the biggest AdonisJS gap (Lucid ORM) with:

- `DrizzleModel` base class + `@Table` / `@Column` / `@PrimaryKey`
  decorators.
- `DrizzleRepository<TTable, TRow>` with `findAll / findOne /
  create / update / delete / transaction`.
- `db.migrate(folder)` for automatic migrations, including
  `autoMigrate: true` on boot.
- `db.transaction(fn)` for ACID transactions.
- `db.raw\`SELECT * FROM users WHERE id = ${id}\`` for
  **SQL-injection-safe** raw queries — values are sent as bound
  parameters, never concatenated into SQL text.

### Added · SQL injection prevention

`db.raw\`...\`` is a tagged template literal. Every interpolated
`${value}` becomes a bound parameter (`$1, $2, ...` for postgres;
`?` for sqlite / mysql). The driver maintains the protocol-level
separation between SQL text and parameter values, so a malicious
input like `"admin' OR 1=1 --"` is treated as a literal string, not
SQL.

### Changed

- Package version bumped to `0.3.0`.
- `NxConfig` now has an optional `dialect` field.
- `MemoryStore` (cache) gained a `tag -> Set<key>` index for
  `invalidateByTag`. The MemoryStore's `invalidateByTag()` is no
  longer a no-op.
- `CacheStore` interface gained optional `invalidateByTag()` and
  `gc()` methods. Existing backends without them continue to work.
- `SessionStorage.name` now accepts `'database'` as a valid value.

### Dependencies

- **Required peer dep**: `drizzle-orm` (the entire `nexus/drizzle`
  module is meaningless without it).
- **Optional peer deps** (installed only when the corresponding
  dialect is used): `pg`, `postgres`, `mysql2`, `better-sqlite3`.
- `pino` and `pino-pretty` added to dependencies for `nexus/logger`.

### Documentation

- New `docs/user-guide/production-basics.md` — health, config, logger, static.
- New `docs/user-guide/cross-cutting-features.md` — limiter, shield, cache, drive, mail.
- New `docs/user-guide/drizzle.md` — comprehensive Drizzle guide with Lucid-compatibility table.
- New `docs/analysis/nestjs-comparison.md` and `docs/analysis/adonisjs-comparison.md` — gap analyses.
- All user guides now have Korean (`.ko.md`) translations.

### Verification (v0.3)

- 322 / 322 tests pass (excluding pre-existing failures in
  `tests/validation`, `tests/e2e`, `tests/config` that predate v0.3).
- `tsc --noEmit` clean.
- 17 bundle entry points; 34 runtime files emitted to `dist/`.

---

## [0.2.0] — 2026-05-15

Feature-complete MVP. The framework gained all of its "v0.2
promised" modules.

### Added

- **`nexus/auth`** — better-auth integration. `AuthService`,
  `AuthController`, `authMiddleware`, `@CurrentUser()` decorator.
- **`nexus/queue`** — BullMQ + Cloudflare Queues + memory backends.
  `@OnQueueReady` decorator, `QueueService.add/process`, retry
  policy, `nx make:queue` scaffold.
- **`nexus/schedule`** — In-tree cron parser (no `croner` /
  `node-cron` deps). `@Cron` / `@Interval` / `@Timeout`
  decorators. `nx make:schedule` scaffold.
- **`nexus/events`** — `NexusEventEmitter` with wildcards
  (`*` / `**`), priorities, guards. `@OnEvent` decorator.
- **`nexus/session`** — Cookie (HMAC) + memory backends. Session
  rotation, sliding expiry, `nx make:session` scaffold.
- **`nx` CLI** — 12 commands: `new`, `init`, `make:crud`,
  `make:controller`, `make:service`, `make:module`, `make:model`,
  `make:migration`, `make:middleware`, `make:validator`, `info`,
  `route:list`.

### Changed

- `@CurrentSession` → `@Session` (current alias kept for
  migration).
- Package version bumped to `0.2.0`.

### Verification (v0.2)

- 117 / 117 tests pass.
- 7 bundle entry points; clean typecheck.

---

## [0.1.0] — 2026-04-30

Initial release. **feature-complete MVP core.**

### Added

- **Core MVC**:
  - `@Controller`, `@Get`, `@Post`, `@Put`, `@Delete`, `@Patch`,
    `@Options`, `@Head` HTTP method decorators.
  - `@Req`, `@Res`, `@Next`, `@Body`, `@Query`, `@Param`,
    `@Headers`, `@Ctx`, `@User` parameter decorators.
  - Three routing styles: **Nest** (class decorators),
    **Adonis** (router table), **Functional** (Hono-native).
- **DI container** — class-based injection with `@Injectable`,
  `@Inject`, `Symbol.for("nexus:X")` tokens, `useExisting`,
  `useFactory`, `useValue` providers, request-scoped lifecycle.
- **Validation pipeline** — Zod schemas via `@Validate` decorator.
- **View engines**:
  - **Rendu** (Bun-native, default).
  - **Edge** (Adonis-style).
  - **Inertia.js adapter** — full SPA UX without an API.
    Asset versioning, lazy-evaluation helpers, merge props.
- **Runtime**:
  - Bun (default).
  - Node (≥ 18) supported via Hono.
  - Cloudflare Workers (Hono adapter).
- **CLI bootstrap** — minimal scaffold tool.

### Verification (v0.1)

- 24 / 24 tests pass.
- Single bundle entry point; clean typecheck.

---

[0.3.0]: https://github.com/kabyeon/nexusjs/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/kabyeon/nexusjs/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/kabyeon/nexusjs/releases/tag/v0.1.0
