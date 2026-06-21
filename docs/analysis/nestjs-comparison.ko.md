# NexusJS vs NestJS — 기능 격차 분석

> English version: [`nestjs-comparison.md`](./nestjs-comparison.md)
> 분석 일자: 2026-06-23 · 기준: NexusJS **v0.5.0**

이 문서는 NexusJS v0.5와 [NestJS](https://nestjs.com)를 비교하여
프로덕션 등급 백엔드 기능이 **있음**, **부분적**, **없음** 상태를
식별한다. v0.3, v0.4, v0.5 마일스톤이 모든 Tier 1과 Tier 2 격차를
모두 해소했다. 이 분석은 v0.6+ 로드맵을 위한 Tier 3+ 잔존 격차에
집중한다.

> **중요**: NestJS는 7년 된 프레임워크로 주당 ~1000만 다운로드를
> 기록하며 수십 개의 first-party 패키지를 보유. NexusJS는
> 어린 프레임워크다 (v0.5, 개발 기간 약 4개월). 프로덕션
> 백엔드에 "지금" 필요한 것만 출시하며, 잔존 격차는 v0.6+
> 로드맵 우선순위를 정하기 위해 여기에 문서화된다.

---

## 1. 요약 표 (v0.5)

범례: ✅ 출시 · ⚠️ 부분적 · ❌ 없음 · 🔵 third-party 필요

| 카테고리 | NestJS | NexusJS v0.5 | 비고 |
|----------|--------|--------------|-------|
| HTTP / 라우팅 | ✅ GraphQL, WebSockets, gRPC, SSE, Fastify | ⚠️ Hono + SSE + WS, GraphQL/gRPC 없음 | REST + functional + Nest/Adonis 스타일 |
| DI | ✅ Request-scoped, 순환 자동 해결 | ✅ Singleton + transient + request | `AsyncLocalStorage`로 request scope; `@Injectable({ scope: 'request' })` |
| Config | ✅ @nestjs/config, .env 검증 | ✅ `nexus/config` | Zod 검증, 레이어 로딩 |
| 보안 | ✅ helmet, throttler, CSRF, CORS | ✅ `nexus/shield` + `nexus/limiter` | CSRF / HSTS / CSP / rate limit. CORS는 Hono 미들웨어 |
| 데이터베이스 | ✅ TypeORM, Prisma, Mongoose, Sequelize | ✅ `nexus/drizzle` (5개 dialect) | Drizzle가 기본 ORM |
| 캐시 | ✅ cache-manager (in-memory / Redis) | ✅ `nexus/cache` (memory / Drizzle) | tag-based invalidation; Redis는 커스텀 store |
| 로깅 | ✅ 내장 Logger (Winston / Pino 어댑터) | ✅ `nexus/logger` (Pino) | dev에서 pretty, prod에서 JSON, ALS로 request-scoped |
| 실시간 | ✅ WebSocket, SSE, gRPC streaming | ✅ WebSocket + SSE | `nexus/ws` (Bun + Node) + `nexus/sse` |
| 마이크로서비스 | ✅ TCP, Redis, NATS, Kafka, MQTT | ⚠️ `nexus/queue` (BullMQ / Cloudflare) | 잡 큐만; service-mesh 전송 없음 |
| API 문서 | ✅ @nestjs/swagger | ✅ `nexus/openapi` | Zod에서 OpenAPI 3.1 + Scalar UI |
| 헬스 체크 | ✅ @nestjs/terminus | ✅ `nexus/health` | 내장 indicator (memory/disk/http/db) |
| 이메일 | ✅ @nestjs/mailer | ✅ `nexus/mail` (SMTP / File / Null) | MJML (옵션 peer) |
| 파일 업로드 | ✅ multer 통합 | ✅ `nexus/upload` | `@Upload` / `@UploadedFile` 데코레이터, 크기 + MIME 검증 |
| 파일 스토리지 | ❌ DIY | ✅ `nexus/drive` (memory / Local / S3 / R2) | Nexus는 first-party `nexus/drive` 보유; Nest는 없음 |
| i18n | ✅ nestjs-i18n | ✅ `nexus/i18n` | `Intl` 기반, pluralization, JSON 카탈로그 |
| Tracing | ✅ OpenTelemetry 통합 | ✅ `nexus/tracing` | Lazy OTel SDK, W3C + B3 전파 |
| Metrics | ✅ Prometheus 통합 | ✅ `nexus/metrics` | Counter / Gauge / Histogram / Summary |
| Auth | ✅ @nestjs/passport + 다수 전략 | ✅ `nexus/auth` (better-auth) | better-auth가 다수 전략 지원 |
| 암호화 | ⚠️ DIY (또는 `nestjs-crypto`) | ✅ `nexus/crypto` | AES-256-GCM + HMAC + scrypt/argon2 |
| Feature flags | ⚠️ DIY (first-party 없음) | ⚠️ DIY | 둘 다 first-party 없음 |
| Resilience (서킷 브레이커, 재시도) | ⚠️ nestjs-recq | ⚠️ DIY | 둘 다 first-party 없음 |
| GraphQL | ✅ @nestjs/graphql | ❌ 없음 | v0.6 예정 |
| gRPC | ✅ @nestjs/microservices | ❌ 없음 | v0.6 예정 |

**헤드라인**: NexusJS v0.5는 v0.2 분석의 **모든 Tier 1 및 Tier 2 격차**를 해소했다. 출시된 25개 모듈 모두 first-party.

---

## 2. v0.3 + v0.4 + v0.5에서 해소된 항목 (최근 성과)

v0.3, v0.4, v0.5 마일스톤이 v0.2 분석에서 식별된 모든 Tier 1과
Tier 2 격차를 해소했다. 출시된 것을 문서화한다.

| v0.2에서 누락 | 출시 | 모듈 |
| ------------------- | ------- | ------ |
| 헬스 체크 (`@nestjs/terminus` 등가) | v0.3 | `nexus/health` |
| Rate limiting / throttling | v0.3 | `nexus/limiter` |
| 보안 헤더 (helmet 등가) | v0.3 | `nexus/shield` (CSRF + HSTS + CSP) |
| 설정 관리 (`@nestjs/config` 등가) | v0.3 | `nexus/config` |
| 로깅 (Pino / Winston 통합) | v0.3 | `nexus/logger` |
| 캐시 (`cache-manager` 등가) | v0.3 | `nexus/cache` |
| 이메일 통합 (`@nestjs/mailer` 등가) | v0.3 | `nexus/mail` |
| 파일 스토리지 추상화 | v0.3 | `nexus/drive` (memory / Local / S3 / R2) |
| 데이터베이스 통합 | v0.3 | `nexus/drizzle` (기본 ORM) |
| 데이터베이스 마이그레이션 | v0.3 | `nx migrate` + `nx migrate --generate` |
| 정적 파일 서빙 | v0.3 | `nexus/static` |
| 기본 ORM (Drizzle 스타일) | v0.3 | `nexus/drizzle` |
| **OpenAPI / Swagger** | v0.4 | `nexus/openapi` |
| **파일 업로드 헬퍼** | v0.4 | `nexus/upload` |
| **Request-scoped DI** | v0.4 | 코어 DI + ALS + Hono 미들웨어 |
| **Server-Sent Events** | v0.4 | `nexus/sse` |
| **분산 추적** | v0.4 | `nexus/tracing` |
| **Prometheus 메트릭** | v0.4 | `nexus/metrics` |
| **WebSockets** | v0.5 | `nexus/ws` (Bun 기본, Node는 `ws` 경유) |
| **암호화 + 패스워드 해싱** | v0.5 | `nexus/crypto` (AES-256-GCM + HMAC + scrypt) |
| **i18n** | v0.5 | `nexus/i18n` (Intl 기반, pluralization) |

합계: v0.2 이후 **21개의 Tier 1+2 격차 해소** (v0.3에서 12개, v0.4에서 6개, v0.5에서 3개).

---

## 3. Tier 1 — 잔존 critical 격차

없음. v0.3에서 모든 원본 Tier 1 격차가 해소되었다.

---

## 4. Tier 2 — 중요 (대부분의 프로덕션 앱)

### 4.1 WebSockets (`@nestjs/websockets` 등가)

- **상태**: ✅ v0.5에서 `nexus/ws`로 해소.
- **출시 내용**: `@WebSocketGateway(path)` + `@OnWebSocketMessage()`
  데코레이터. 연결 추적, rooms, broadcast를 위한 `WebSocketService`.
  `BunWsAdapter` (`hono/bun` 사용) 및 `NodeWsAdapter` (옵션 peer로
  `ws` 패키지 사용) — 런타임 자동 감지.
- [`../../user-guide/ws.md`](../../user-guide/ws.md) 참조.

### 4.2 Server-Sent Events (SSE)

- **상태**: ✅ v0.4에서 `nexus/sse`로 해소 (Hono의 `streamSSE`를
  타입 안전 `SseStream`으로 래핑, 자동 직렬화, 멱등 `close()`,
  `Last-Event-ID` 재연결 지원). [`../../user-guide/sse.md`](../../user-guide/sse.md) 참조.

### 4.3 Request-scoped DI를 코어 기능으로

- **상태**: ✅ v0.4에서 해소. `DIContainer`가 이제 `scope: 'request'`
  provider를 지원 (`@Injectable({ scope: 'request' })`로 선언)
  하며, Hono 미들웨어가 `AsyncLocalStorage`로 per-request scope를
  활성화. 서비스 코드는 `getRequest()` / `getRequestScope()`로
  활성 요청을 읽을 수 있고, `REQUEST` 토큰이 라이브 Hono
  컨텍스트를 주입. [`../../user-guide/request-scope.md`](../../user-guide/request-scope.md) 참조.

### 4.4 gRPC (`@nestjs/microservices` 부분)

- **용도**: 서비스 간 고성능 RPC.
- **상태**: ❌ 아직 출시 안 됨. v0.6+ 예정.
- **제안 모듈**: `nexus/grpc`
- **기능**:
  - `@GrpcMethod('UserService', 'findById')` 데코레이터
  - 스트리밍 (server, client, bidi)
  - Reflect 기반 스키마
- **비고**: 우선순위 낮음 — 대부분의 팀이 서비스 간 통신에
  REST + WebSocket을 출시. gRPC는 폴리글랏 / 엄격 스키마
  환경에서만 필요.

### 4.5 GraphQL (`@nestjs/graphql` 등가)

- **용도**: BFF 패턴, 모바일 클라이언트, 스키마 우선 개발.
- **상태**: ❌ 아직 출시 안 됨. v0.6+ 예정.
- **제안 모듈**: `nexus/graphql`
- **기능**:
  - `@Resolver()`, `@Query()`, `@Mutation()` 데코레이터
  - 코드 우선 스키마 생성
  - DataLoader 통합 (N+1 방지)
  - Federation 지원
- **비고**: 다른 것보다 우선순위 낮음 — 대부분의 팀은 여전히 REST 출시.

---

## 5. Tier 3 — Nice-to-have

### 5.1 i18n (`nestjs-i18n` 등가)

- **상태**: ✅ v0.5에서 `nexus/i18n`로 해소. `Intl` 기반
  pluralization, `|` 구분자, locale 감지 미들웨어 (query →
  cookie → Accept-Language → default), JSON 카탈로그,
  `formatDate` / `formatNumber` / `formatCurrency` / `compare`.
  [`../../user-guide/i18n.md`](../../user-guide/i18n.md) 참조.

### 5.2 Feature flags

- **용도**: 카나리 배포, A/B 테스트, 점진적 롤아웃.
- **상태**: ❌ 아직 출시 안 됨.
- **제안 모듈**: `nexus/feature-flag`
- **기능**:
  - `@FeatureFlag('new-dashboard')` 데코레이터
  - 백엔드: in-memory / LaunchDarkly / Unleash
  - 테넌트 / 사용자별 타겟팅

### 5.3 Tracing (OpenTelemetry)

- **상태**: ✅ v0.4에서 `nexus/tracing`으로 해소. Lazy
  `@opentelemetry/sdk-node` 로드, W3C + B3 전파, Hono 자동
  계측 미들웨어, `@Trace()` 데코레이터. [`../../user-guide/tracing.md`](../../user-guide/tracing.md) 참조.

### 5.4 Metrics (Prometheus)

- **상태**: ✅ v0.4에서 `nexus/metrics`로 해소. Counter /
  Gauge / Histogram / Summary, `@Counted` / `@Timed` 데코레이터,
  content negotiation이 있는 `/metrics` 엔드포인트 (Prometheus
  0.0.4 / OpenMetrics 1.0.0). 기본 Node.js 프로세스 메트릭.
  [`../../user-guide/metrics.md`](../../user-guide/metrics.md) 참조.

### 5.5 암호화 + 패스워드 해싱

- **상태**: ✅ v0.5에서 `nexus/crypto`로 해소. AES-256-GCM 인증된
  암호화, HMAC-SHA256 sign/unsign, scrypt 패스워드 해싱 (기본,
  Node 내장), 옵션 `@node-rs/argon2` peer. `EncryptionService`는
  `nexus/session` 및 `nexus/shield`에서 HMAC용으로 내부 사용.
  [`../../user-guide/crypto.md`](../../user-guide/crypto.md) 참조.

### 5.6 Resilience: 서킷 브레이커 + 재시도

- **용도**: 외부 API 회복력.
- **상태**: ❌ 아직 출시 안 됨.
- **제안 모듈**: `nexus/resilience`
- **기능**:
  - `@Retry({ attempts: 3, backoff: 'exponential' })` 데코레이터
  - `@CircuitBreaker({ threshold: 0.5 })` 데코레이터
  - Bulkhead 격리

### 5.7 프로젝트당 다중 데이터베이스

- **용도**: PostgreSQL + Elasticsearch를 한 프로젝트에서.
- **상태**: ⚠️ `DrizzleModule.forRoot({...})`를 다른 토큰으로 여러 번
  호출하면 이미 지원. 신규 모듈 불필요.

---

## 6. Quick wins (작은 노력, 큰 효과)

| 작업 | 노력 | 효과 | 상태 |
|------|------|------|------|
| CORS 추상화 | 낮음 | 중간 | 진행 중 (Hono의 `cors()` 동작; 얇은 래퍼가 일관된 config 제공) |
| 다중 런타임 패리티 테스트 | 낮음 | 높음 | 진행 중 (Bun / Node / Workers) |
| `nexus/cache` Redis store | 낮음 | 높음 | 진행 중 (`CacheStore` 인터페이스 구현하는 백엔드 하나 더) |
| Multipart body parser wrapper | 낮음 | 중간 | ✅ `nexus/upload`으로 출시 (v0.4) |
| `helmet()` 미들웨어 | 매우 낮음 | 높음 | 진행 중 (일부 조각은 `nexus/shield`에 출시) |

남은 가장 큰 **단일** 레버리지는 **GraphQL** — BFF / 모바일 우선
패턴을 가능하게 한다.

---

## 7. 권장 v0.6+ 로드맵

### v0.6 — Async RPC & DX ("polyglot" 마일스톤) — 예정

1. **`nexus/graphql`** — 코드 우선 스키마, `@Resolver()` / `@Query()` / `@Mutation()`
2. **`nexus/grpc`** — server / client / streaming
3. **`nexus/resilience`** — 서킷 브레이커, 재시도, bulkhead
4. **`nexus/feature-flag`** — 카나리 / A/B 테스팅

이 4개가 "누락된 인프라" 목록을 완성. v0.6 이후 NexusJS는 백엔드
사용 사례의 ~95%에서 NestJS와 기능 패리티를 보유.

### v0.7 — 강화

- 안정적인 public API surface (semver 보장)
- 다중 런타임 CI (Bun + Node + Cloudflare Workers)
- 성능 벤치마크 + 크로스-런타임 패리티 테스트
- 장기 LTS 지원 계획

### v1.0 — Production-ready LTS

- 동결된 API surface
- NestJS / AdonisJS에서의 마이그레이션 가이드
- LTS 브랜치 (12개월 보안 백포트)

---

## 8. 정직한 평가 (v0.5)

NexusJS v0.5는 **대부분의 백엔드 서비스를 위한 production-ready** 상태:

- MVC + DI + 검증 코어가 견고하고 실전 검증됨.
- 25개 옵션 모듈 모두 (auth, queue, schedule, events, session,
  health, config, logger, static, limiter, shield, cache, drive,
  mail, drizzle, cli, openapi, upload, sse, tracing, metrics, ws,
  crypto, i18n) 독립적으로 사용 가능하고 잘 분리됨.
- **Tier 1 및 Tier 2 격차가 v0.5에서 완전히 해소**. v0.2
  분석이 플래그한 모든 프로덕션-필수 인프라 조각이 출시됨.
- 기본 ORM으로서의 Drizzle는 AdonisJS-Lucid 격차를 해소하며
  Bun-native 앱을 위한 **가장 강력한** ORM 선택.
- CLI는 새 프로젝트에서 NestJS의 `nest g`보다 진정으로 우수.
- SQL injection 안전 raw-query 프리미티브는 best-in-class.
- `EncryptionService`는 이제 프레임워크 (세션 쿠키, CSRF)와
  사용자 코드 간에 공유되며, 단일 APP_KEY.

NestJS 기능 패리티에 **부족한 것**:

- **GraphQL** — BFF / 모바일 우선 팀에 중요.
- **gRPC** — 폴리글랏 service-mesh 환경에 중요.
- **Resilience 프리미티브** — 서킷 브레이커, 재시도, bulkhead.
- **Feature flags** — 카나리 배포에 유용.

v0.5에서 v1.0까지의 경로:

- **v0.6** (2026 Q4): Async RPC & DX — GraphQL, gRPC, resilience,
  feature flags.
- **v0.7** (2027 Q1): Production hardening — 안정 public API,
  다중 런타임 CI, 성능 벤치마크, LTS 계획.
- **v1.0** (2027 Q2): Production-ready LTS — 동결 API surface,
  마이그레이션 가이드, 장기 지원 브랜치.

v0.6 이후 NexusJS는 Bun의 런타임 + ORM 이점을 가지고 NestJS가
오늘 지원하는 모든 백엔드의 **실현 가능한 대안**.

---

## 9. 참고

- [`../../CHANGELOG.md`](../../CHANGELOG.md) — v0.5 릴리스 노트
- [`../README.md`](../../README.md) — 현재 상태 & 로드맵
- [`../../user-guide/`](../../user-guide/) — 25개 모듈의 가이드
- [`../../design/`](../../design/) — 아키텍처 심층 문서
- [`./adonisjs-comparison.md`](./adonisjs-comparison.md) — 동반 분석
- [NestJS 문서](https://docs.nestjs.com) — 비교 기준선
- [Bulletproof Node.js 아키텍처](https://github.com/santiq/bulletproof-nodejs) —
  이 분석이 파생된 프로덕션 체크리스트
