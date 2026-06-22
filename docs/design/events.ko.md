# 이벤트 모듈 — 디자인 문서

> English version: [`events.md`](./events.md)

이 문서는 `@kabyeon/nexusjs/events`의 아키텍처를 설명합니다:
인프로세스 이미터, 와일드카드 매칭, 우선순위 기반 디스패치,
가드, 원샷 리스너, `@OnEvent` 데코레이터 통합.

## 목표

1. **인프로세스 이벤트 버스.** 외부 의존성 없음 (Redis, 메시지 브로커
   불필요). 이벤트는 동일 프로세스 내에서 동기적으로 디스패치됨.
2. **와일드카드 패턴.** `*` (단일 세그먼트)와 `**` (다중 세그먼트)로
   유연한 구독 — 예: `user.*`는 `user.created`와 `user.deleted`에 매칭.
3. **우선순위와 가드.** 낮은 우선순위 리스너가 먼저 실행. 가드(`if` 조건)
  는 구독 해지/재구독 없이 조건부 건너뛰기 가능.
4. **원샷 리스너.** 첫 번째 매치 후 자동 제거.
5. **`@OnEvent` 데코레이터.** 서비스 메서드에 선언적 구독, 부트 시 스캔.
6. **기본적으로 탄력적.** 예외를 던지는 리스너가 다른 리스너를 중단하지
   않음. 오류는 검사를 위해 `EmitResult.errors`에 수집됨.

## 참고

- [`../user-guide/events.ko.md`](../user-guide/events.ko.md) — 사용자 가이드
- [`../design/tracing.ko.md`](../design/tracing.ko.md) — 트레이싱 모듈 (이미터 이벤트 소비)
- [`../design/metrics.ko.md`](../design/metrics.ko.md) — 메트릭스 모듈 (이미터 이벤트 소비)
