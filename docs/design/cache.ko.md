# 캐시 모듈 — 디자인 문서

> English version: [`cache.md`](./cache.md)

이 문서는 `@kabyeon/nexusjs/cache`의 아키텍처를 설명합니다:
`CacheStore` 인터페이스, 세 가지 내장 백엔드, `wrap` 패턴, 데코레이터
통합, 태그 기반 무효화.

## 목표

1. **플러그 가능한 백엔드.** 메모리(기본), Redis, Drizzle — 그리고
   `CacheStore`를 구현하는 모든 사용자 정의 백엔드.
2. **Cache-or-compute (`wrap`).** 단일 원자적 패턴: 먼저 캐시 확인,
   미스 시 계산, 결과 저장. `get`과 `set` 사이의 TOCTOU 경합 방지.
3. **태그 기반 무효화.** 정확한 키를 모르는 상태에서 관련 항목 그룹을
   무효화. 관련 데이터가 변경될 때 캐시 일관성 유지에 필수적.
4. **데코레이터 API.** 서비스 메서드에 선언적 캐싱을 위한 `@Cacheable`
   및 `@CacheInvalidate`.
5. **크로스 런타임.** Bun, Node.js, Cloudflare Workers에서 작동
   (Drizzle 스토어 또는 사용자 정의 어댑터를 통해).

## 참고

- [`../user-guide/cache.ko.md`](../user-guide/cache.ko.md) — 사용자 가이드
- [`../user-guide/redis.ko.md`](../user-guide/redis.ko.md) — Redis 클라이언트
