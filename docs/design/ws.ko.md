# WebSocket 모듈 — 디자인 문서

> English version: [`ws.md`](./ws.md)

이 문서는 `@kabyeon/nexusjs/ws`의 아키텍처를 설명합니다:
게이트웨이 데코레이터 패턴, 런타임 어댑터(Bun vs Node), 룸 기반
브로드캐스팅, 생명주기 훅.

## 목표

1. **단일 API, 두 런타임.** 동일한 `@WebSocketGateway`, 동일한 생명주기
   데코레이터, 동일한 브로드캐스팅 API — Bun(기본, `Bun.serve` websocket
   사용)과 Node.js(`ws` 패키지 사용)에서 작동.
2. **게이트웨이 패턴.** `@WebSocketGateway(path)`로 클래스를 장식하면
   프레임워크가 업그레이드, 생명주기, 메시지 라우팅을 처리.
3. **룸 기반 브로드캐스팅.** 외부 의존성 없이 `joinRoom`, `leaveRoom`,
   `broadcastToRoom` — 표준 WebSocket 룸 메커니즘.
4. **생명주기 훅.** `@OnWebSocketOpen`, `@OnWebSocketMessage`,
   `@OnWebSocketClose`, `@OnWebSocketError` — 선언적 이벤트 핸들러.

## 참고

- [`../user-guide/ws.ko.md`](../user-guide/ws.ko.md) — 사용자 가이드
- [`../design/sse.ko.md`](../design/sse.ko.md) — Server-Sent Events (WebSocket 대안)
