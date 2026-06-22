# Crypto 모듈 — 디자인 문서

> English version: [`crypto.md`](./crypto.md)

이 문서는 `@kabyeon/nexusjs/crypto`의 아키텍처를 설명합니다:
AES-256-GCM 암호화, HMAC 기반 서명, 비밀번호 해싱(scrypt 및 argon2),
목적 태그 서명 체계.

## 목표

1. **핵심 연산에 제로 외부 의존성.** AES-256-GCM, HMAC-SHA256, scrypt는
   모두 Node 내장 `crypto` 모듈에서 제공. `bcrypt`나 `libsodium` 불필요.
2. **목적 태그 서명.** 모든 서명된 값에는 목적 태그(예: `"csrf"`,
   `"session"`)가 포함되어, 동일한 키를 사용하더라도 CSRF 토큰이 세션
   토큰으로 재사용될 수 없음.
3. **두 가지 해싱 알고리즘.** scrypt(기본, 의존성 없음)와 argon2id
   (선택적 `@node-rs/argon2` 피어 의존성).
4. **DI 통합.** `CryptoModule.forRoot({ key })`가 `EncryptionService`와
   `HashService`를 컨테이너에 연결.

## 참고

- [`../user-guide/crypto.ko.md`](../user-guide/crypto.ko.md) — 사용자 가이드
- [`../design/shield.ko.md`](../design/shield.ko.md) — CSRF 서명에 사용
- [`../design/session.ko.md`](../design/session.ko.md) — 세션 서명에 사용
