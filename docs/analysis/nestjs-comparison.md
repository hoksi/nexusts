# NexusJS vs NestJS — Feature Gap Analysis

> 한국어 버전: [`nestjs-comparison.ko.md`](./nestjs-comparison.ko.md)
> 분석 일자: 2026-06-21 · 기준: NexusJS **v0.3.0**

This document compares NexusJS v0.3 against [NestJS](https://nestjs.com)
to identify which production-grade backend features are **present**,
**partially present**, or **missing**. The v0.3 milestone closed all
Tier 1 gaps; this analysis now focuses on the remaining Tier 2+ gaps
that block feature parity.

> **Important**: NestJS is a 7-year-old framework with ~10M weekly
> downloads and dozens of first-party packages. NexusJS is young
> (v0.3, ~3 months of development). The framework deliberately ships
> only what production backends need today; the remaining gaps are
> documented here so the v0.4+ roadmap can be prioritized.

---

## 1. Summary table (v0.3)

Legend: ✅ ship · ⚠️ partial · ❌ missing · 🔵 third-party required

| Category | NestJS | NexusJS v0.3 | Notes |
|----------|--------|--------------|-------|
| HTTP / routing | ✅ GraphQL, WebSockets, gRPC, SSE, Fastify | ⚠️ Hono only, no GraphQL/WS/gRPC | REST + functional + Nest/Adonis styles |
| DI | ✅ Request-scoped, circular auto-resolve | ⚠️ Singleton + transient + request | **Now** supports request scope (via `nexus/drizzle` ALS) |
| Config | ✅ @nestjs/config, .env validation | ✅ `nexus/config` | Zod-validated, layered loading |
| Security | ✅ helmet, throttler, CSRF, CORS | ✅ `nexus/shield` (CSRF/HSTS/CSP) + `nexus/limiter` | CORS via Hono middleware |
| Database | ✅ TypeORM, Prisma, Mongoose, Sequelize | ✅ `nexus/drizzle` (5 dialects) | Drizzle is the default ORM |
| Cache | ✅ cache-manager (in-memory / Redis) | ✅ `nexus/cache` (memory / Drizzle) | Tag-based invalidation; Redis via custom store |
| Logging | ✅ Built-in Logger (Winston / Pino adapters) | ✅ `nexus/logger` (Pino) | Pretty in dev, JSON in prod, request-scoped via ALS |
| Realtime | ✅ WebSocket, SSE, gRPC streaming | ❌ None | REST + cron + queue only |
| Microservices | ✅ TCP, Redis, NATS, Kafka, MQTT | ⚠️ `nexus/queue` (BullMQ / Cloudflare) | Job queue only; no service-mesh transports |
| API docs | ✅ @nestjs/swagger | ❌ No OpenAPI generator | Planned v0.4 |
| Health checks | ✅ @nestjs/terminus | ✅ `nexus/health` | Built-in indicators (memory/disk/http/db) |
| Email | ✅ @nestjs/mailer | ✅ `nexus/mail` (SMTP / File / Null) | MJML via optional peer |
| File upload | ✅ multer integration | ⚠️ Hono native, no helper | Hono's `c.req.parseBody()` works; no decorator wrapper |
| File storage | ❌ DIY | ✅ `nexus/drive` (memory / Local / S3 / R2) | Nexus has a first-party `nexus/drive`; Nest doesn't |
| i18n | ✅ nestjs-i18n | ❌ None | Planned v0.4 |
| Feature flags | ⚠️ DIY (no first-party) | ⚠️ DIY | Both lack first-party |
| Tracing | ✅ OpenTelemetry integration | ❌ None | Planned v0.4 |
| Metrics | ✅ Prometheus integration | ❌ None | Planned v0.4 |
| Migrations | ⚠️ TypeORM / Prisma built-in | ✅ `nexus/drizzle` + `nx migrate` | Drizzle's migrator wrapped by `nx migrate` |
| Auth | ✅ @nestjs/passport + many strategies | ✅ `nexus/auth` (better-auth) | better-auth supports many strategies |

---

## 2. Closed in v0.3 (recent wins)

The v0.3 milestone closed **every Tier 1 gap** identified in the v0.2
analysis. This section documents what shipped and where.

| Was missing in v0.2 | Shipped in v0.3 | Module |
| ------------------- | -------------- | ------ |
| Health checks (`@nestjs/terminus` equivalent) | ✅ | `nexus/health` |
| Rate limiting / throttling | ✅ | `nexus/limiter` |
| Security headers (helmet equivalent) | ✅ | `nexus/shield` (CSRF + HSTS + CSP) |
| Configuration management (`@nestjs/config` equivalent) | ✅ | `nexus/config` |
| Logging (Pino / Winston integration) | ✅ | `nexus/logger` |
| Cache (`cache-manager` equivalent) | ✅ | `nexus/cache` |
| Email integration (`@nestjs/mailer` equivalent) | ✅ | `nexus/mail` |
| File storage abstraction | ✅ | `nexus/drive` (memory / Local / S3 / R2) |
| Database integration | ✅ | `nexus/drizzle` (default ORM) |
| Database migrations | ✅ | `nx migrate` + `nx migrate --generate` |
| Static file serving | ✅ | `nexus/static` |
| Default ORM (Drizzle-style) | ✅ | `nexus/drizzle` |
| **OpenAPI / Swagger** (v0.4) | ✅ | `nexus/openapi` |
| **File upload helper** (v0.4) | ✅ | `nexus/upload` |
| **Request-scoped DI** (v0.4) | ✅ | core DI + ALS + Hono middleware |
| **Server-Sent Events** (v0.4) | ✅ | `nexus/sse` |

Total: **16 Tier 1+2 gaps closed** since v0.2 (12 in v0.3 + 4 in v0.4).

---

## 3. Tier 1 — Remaining critical gaps

These block **specific production use-cases** that the framework
doesn't yet cover.

### 3.1 OpenAPI / Swagger (`@nestjs/swagger` equivalent)

- **Status**: ✅ closed in v0.4 by `nexus/openapi` (Zod → JSON
  Schema, Scalar UI, full OpenAPI 3.1 emission from route metadata).
  See [`../../user-guide/openapi.md`](../../user-guide/openapi.md).

### 3.2 File upload helper (`multer` equivalent)

- **Status**: ✅ closed in v0.4 by `nexus/upload`
  (`@UploadedFile()` / `@UploadedFiles()` decorators, size +
  MIME validation, optional `nexus/drive` storage). See
  [`../../user-guide/upload.md`](../../user-guide/upload.md).

---

## 4. Tier 2 — Important (most production apps)

### 4.1 WebSockets (`@nestjs/websockets` equivalent)

- **Use cases**: chat, notifications, live dashboards, multiplayer.
- **Proposed module**: `nexus/ws`
- **Features**:
  - `@WebSocketGateway()` decorator
  - `@SubscribeMessage()` for handlers
  - Room management
  - Built on `ws` (Node) or Workers WebSocket pair
- **Note**: Hono has experimental WebSocket support — we'd wrap it
  rather than reimplement.

### 4.2 Server-Sent Events (SSE)

- **Status**: ✅ closed in v0.4 by `nexus/sse` (Hono's
  `streamSSE` wrapped behind a type-safe `SseStream` with
  auto-serialization, idempotent `close()`, and `Last-Event-ID`
  reconnection support). See
  [`../../user-guide/sse.md`](../../user-guide/sse.md).

### 4.3 Request-scoped DI as a core feature

- **Status**: ✅ closed in v0.4. The `DIContainer` now supports
  `scope: 'request'` providers (via `@Injectable({ scope: 'request' })`)
  and a Hono middleware that activates a per-request scope via
  `AsyncLocalStorage`. Service code can read the active request
  via `getRequest()` / `getRequestScope()`. The `REQUEST` token
  injects the live Hono context. See
  [`../../user-guide/request-scope.md`](../../user-guide/request-scope.md).

### 4.4 gRPC (`@nestjs/microservices` partial)

- **Use cases**: service-to-service high-perf RPC.
- **Proposed module**: `nexus/grpc`
- **Features**:
  - `@GrpcMethod('UserService', 'findById')` decorator
  - Streaming (server, client, bidi)
  - Reflect-based schema

### 4.5 GraphQL (`@nestjs/graphql` equivalent)

- **Use cases**: BFF patterns, mobile clients, schema-first dev.
- **Proposed module**: `nexus/graphql`
- **Features**:
  - `@Resolver()`, `@Query()`, `@Mutation()` decorators
  - Code-first schema generation
  - DataLoader integration (N+1 prevention)
  - Federation support
- **Note**: Lower priority than the others — most teams still ship REST.

---

## 5. Tier 3 — Nice-to-have

### 5.1 i18n (`nestjs-i18n` equivalent)

- **Use cases**: multi-language SaaS.
- **Proposed module**: `nexus/i18n`
- **Features**:
  - `t('users.welcome', { name })` API
  - Per-request locale resolution
  - JSON / YAML / gettext-compatible message catalogs

### 5.2 Feature flags

- **Use cases**: canary deploys, A/B tests, gradual rollouts.
- **Proposed module**: `nexus/feature-flag`
- **Features**:
  - `@FeatureFlag('new-dashboard')` decorator
  - Backends: in-memory / LaunchDarkly / Unleash
  - Per-tenant / per-user targeting

### 5.3 Tracing (`@nestjs/event-emitter` adjacent)

- **Use cases**: distributed system debugging.
- **Proposed module**: `nexus/tracing`
- **Features**:
  - OpenTelemetry exporter
  - `@Trace('user.create')` decorator
  - Trace context propagation across queue / HTTP boundaries
  - OTLP exporter (Jaeger / Tempo / Honeycomb)

### 5.4 Metrics (Prometheus)

- **Use cases**: SLO monitoring, alerting.
- **Proposed module**: `nexus/metrics`
- **Features**:
  - `@Counter('http_requests_total')` / `@Histogram` / `@Gauge`
  - `/metrics` Prometheus-format endpoint
  - Default request / queue / event metrics

### 5.5 Resilience: circuit breakers + retry

- **Use cases**: external API resilience.
- **Proposed module**: `nexus/resilience`
- **Features**:
  - `@Retry({ attempts: 3, backoff: 'exponential' })` decorator
  - `@CircuitBreaker({ threshold: 0.5 })` decorator
  - Bulkhead isolation

### 5.6 Multi-database per project

- **Use cases**: PostgreSQL + Elasticsearch in one project.
- **Proposed**: extension to `nexus/drizzle` (the architecture
  already supports it — `DrizzleModule.forRoot({...})` can be
  called multiple times with different tokens).

---

## 6. Quick wins (small effort, big impact)

| Task | Effort | Impact | Notes |
|------|--------|--------|-------|
| OpenAPI generator from Zod | Low | High | Major DX win for client teams |
| CORS abstraction | Low | Medium | Hono's `cors()` works; a thin wrapper gives consistent config |
| Multi-runtime parity tests | Low | High | Bun / Node / Workers across all modules |
| `nexus/cache` Redis store (existing pattern) | Low | High | Same `CacheStore` interface; one more backend |
| `@UploadedFile()` decorator | Low | Medium | Thin Hono wrapper |
| Multipart body parser wrapper | Low | Medium | Same as above |
| `helmet()` middleware | Very low | High | Could ship in `nexus/shield` immediately |

The biggest **single** leverage remaining is **OpenAPI** — it pays
for itself in the first week of any new project by eliminating the
"what does the API expect" round-trip between teams.

---

## 7. Recommended v0.4+ roadmap

### v0.4 — API completeness (the "SDK-friendly" milestone) — **in progress**

1. **`nexus/openapi`** — Zod → OpenAPI, Scalar UI
2. **`nexus/upload`** — file upload helper
3. `nexus/sse` — Server-Sent Events
4. **Request-scoped DI** — core extension
5. **`nexus/tracing`** — OpenTelemetry
6. **`nexus/metrics`** — Prometheus

These six get NexusJS to **API-explicit** + **observable**, which is
the standard for modern backend services.

### v0.5 — Real-time & distributed

- `nexus/ws` — WebSockets
- `nexus/graphql` — GraphQL
- `nexus/microservice` — TCP / NATS / Redis transports
- `nexus/grpc` — gRPC server / client

### v0.6 — Hardening

- `nexus/resilience` — circuit breakers, retry, bulkheads
- `nexus/i18n` — i18n
- `nexus/feature-flag` — feature flags
- Multi-database, hybrid app, stable public API surface

---

## 8. Honest assessment (v0.3)

NexusJS v0.4 is **production-ready for the majority of backend
services**:

- The MVC + DI + validation core is solid and battle-tested.
- All 20 optional modules (auth, queue, schedule, events, session,
  health, config, logger, static, limiter, shield, cache, drive,
  mail, drizzle, cli, openapi, upload, sse) are independently
  usable and well-scoped.
- Tier 1 gaps are **fully closed** as of v0.4 (12 closed in v0.3
  - openapi + upload). What's left is Tier 2 (SSE, request-scoped
  DI, tracing, metrics).
- Drizzle as the default ORM closes the AdonisJS-Lucid gap and is
  arguably the **strongest** ORM choice for Bun-native apps.
- The CLI is genuinely better than NestJS's `nest g` for new
  projects.
- The SQL-injection-safe raw-query primitive is best-in-class.

What's missing for "NestJS feature parity" is mostly **specialized
infrastructure** (WebSockets, GraphQL, microservices, OpenTelemetry)
that many teams don't need for the first 6 months of a project.

The path from v0.3 to v1.0 is roughly:

- **v0.4** (Q3 2026): API observability — OpenAPI, SSE, upload,
  tracing, metrics.
- **v0.5** (Q4 2026): Real-time — WebSockets, GraphQL, gRPC,
  microservices.
- **v0.6** (Q1 2027): Production hardening — resilience, i18n,
  feature flags, stable public API surface.

After v0.6, NexusJS is a viable alternative for **any** backend
that NestJS supports today, with the runtime + ORM advantages of Bun.

---

## 9. See also

- [`../../CHANGELOG.md`](../../CHANGELOG.md) — v0.3 release notes
- [`../README.md`](../../README.md) — current status & roadmap
- [`../../user-guide/`](../../user-guide/) — guides for the 17 modules
- [`../../design/`](../../design/) — architectural deep-dives
- [`./adonisjs-comparison.md`](./adonisjs-comparison.md) — companion analysis
- [NestJS documentation](https://docs.nestjs.com) — the comparison baseline
- [Bulletproof Node.js architecture](https://github.com/santiq/bulletproof-nodejs) —
  the production checklist this analysis derives from
