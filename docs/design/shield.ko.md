# Shield 모듈 — 디자인 문서

> English version: [`shield.md`](./shield.md)

이 문서는 `@kabyeon/nexusjs/shield`의 아키텍처를 설명합니다:
CSRF 보호, 보안 헤더, 가드의 구성 방식, 미들웨어 파이프라인.

## 목표

1. **심층 방어.** 변경 요청용 CSRF 토큰, HTTPS 강제용 HSTS, XSS 완화용
   CSP, 클릭재킹/스니핑/리퍼러 보호용 표준 헤더 — 모두 하나의 모듈.
2. **동기화 토큰 패턴 (이중 제출 아님).** CSRF 토큰은 시크릿 키로
   서명되고 쿠키 값과 대조 검증됩니다. 많은 프레임워크가 사용하는
   이중 제출 쿠키 패턴보다 강력합니다.
3. **AdonisJS 형태의 API.** AdonisJS에서 오는 개발자에게 친숙한 설정.
   동일한 가드와 동일한 기본값.
4. **비활성화 시 제로 오버헤드.** 각 가드는 개별적으로 비활성화(`false`)
   가능. 비활성화된 가드는 트리 셰이크 가능 — 할당이나 실행 없음.

## 아키텍처

```
                  ┌───────────────────────────────┐
                  │       ShieldMiddleware          │
                  │  (단일 Hono 미들웨어)           │
                  │                                 │
                  │  ┌────────────┐  ┌───────────┐  │
                  │  │ CsrfGuard  │  │HeadersGuard│  │
                  │  │ (변경 요청)│  │ (모든 요청)│  │
                  │  │  403 |     │  │  HSTS      │  │
                  │  │  통과      │  │  CSP       │  │
                  │  │            │  │  XFO       │  │
                  │  │            │  │  XCTO      │  │
                  │  │            │  │  RP        │  │
                  │  └────────────┘  └───────────┘  │
                  └──────────────────────────────────┘
```

## 참고

- [`../user-guide/shield.ko.md`](../user-guide/shield.ko.md) — 사용자 가이드
- [`crypto.ko.md`](./crypto.ko.md) — 암호화 서비스
- [`cross-cutting-features.ko.md`](../user-guide/cross-cutting-features.ko.md) — 개요
