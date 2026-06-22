# 레이트 리미터 모듈 — 디자인 문서

> English version: [`limiter.md`](./limiter.md)

이 문서는 `@kabyeon/nexusjs/limiter`의 아키텍처를 설명합니다:
세 가지 전략, 백엔드 스토리지 인터페이스, 글로벌 규칙과 데코레이터의
상호 작용, 미들웨어 파이프라인.

## 목표

1. **플러그 가능한 전략.** 기본으로 fixed-window, sliding-window,
   token-bucket을 지원하고 사용자 정의 전략을 추가할 수 있음.
2. **플러그 가능한 스토리지.** 단일 프로세스용 인메모리, 영속성용 Drizzle,
   Redis/Workers KV 등 사용자 정의 백엔드.
3. **2계층 규칙 적용.** 경로/메서드 기반 글로벌 규칙과 라우트별
   데코레이터(`@RateLimit`). 둘 다 동일한 `LimiterService.check()` 경로 사용.
4. **번들 영향 제로.** 모듈은 별도 진입점입니다. 임포트하지 않는 사용자는
   비용을 부담하지 않음.
5. **표준 레이트 리밋 헤더.** 모든 응답에 `X-RateLimit-Limit`,
   `X-RateLimit-Remaining`, `X-RateLimit-Reset`, 429 시 `Retry-After` 포함.

## 아키텍처

```
                  ┌───────────────────────────────┐
                  │       사용자 컨트롤러           │
                  │  @RateLimit({ points: 5, ... })│
                  └───────────┬───────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   ▼                   │
          │       LimiterMiddleware               │
          │   (글로벌 규칙을 순서대로 적용)         │
          │                   │                   │
          │         LimiterService.check(key,rule)│
          │                   ▼                   │
          │       RateLimitStorage.consume(...)   │
          │          ┌─────────────────┐          │
          │          │   MemoryStorage │          │
          │          │  DrizzleStorage │          │
          │          │  CustomStorage  │          │
          │          └─────────────────┘          │
          └───────────────────────────────────────┘
```

## 참고

- [`../user-guide/limiter.ko.md`](../user-guide/limiter.ko.md) — 사용자 가이드
- [`cross-cutting-features.ko.md`](../user-guide/cross-cutting-features.ko.md) — 개요
