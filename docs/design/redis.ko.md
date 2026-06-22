# Redis 모듈 — 디자인 문서

> English version: [`redis.md`](./redis.md)

이 문서는 `@kabyeon/nexusjs/redis`의 아키텍처를 설명합니다:
통합 `RedisClient` 인터페이스, 런타임 인식 어댑터 선택, 세션/캐시/큐
모듈이 이에 의존하는 방식.

## 목표

1. **런타임 간 단일 `RedisClient` 인터페이스.** Bun 내장 `Bun.redis`,
   Node.js의 `ioredis`, Cloudflare Workers KV — 모두 동일한 최소 API
   뒤에서.
2. **런타임 자동 감지.** 수동 설정 없이 올바른 어댑터 생성.
   `createRedisClient()`가 Bun, Node, Workers를 감지하고 일치하는
   구현체 반환.
3. **선택적 피어 의존성.** `ioredis`는 Node에서만 필요. Bun과 Workers
   어댑터는 내장 API 사용 (제로 의존성).
4. **공유 기반.** `nexusjs/session`, `nexusjs/cache`, `nexusjs/queue`가
   모두 `RedisClient`에 의존하므로, 단일 설정 스위치로 세 가지 모두의
   백엔드를 선택 가능.

## 참고

- [`../user-guide/redis.ko.md`](../user-guide/redis.ko.md) — 사용자 가이드
- [`../design/session.ko.md`](../design/session.ko.md) — 세션 모듈
- [`../design/cache.ko.md`](../design/cache.ko.md) — 캐시 모듈
