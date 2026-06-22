# Mail 모듈 — 디자인 문서

> English version: [`mail.md`](./mail.md)

이 문서는 `@kabyeon/nexusjs/mail`의 아키텍처를 설명합니다:
`MailTransport` 인터페이스, 세 가지 내장 트랜스포트, MJML 통합,
제로 의존성 설계.

## 목표

1. **플러그 가능한 트랜스포트.** 프로덕션용 SMTP, 개발용 `.eml` 파일,
   테스트용 널 — 그리고 `MailTransport`를 구현하는 모든 사용자 정의
   트랜스포트.
2. **필수 의존성 없음.** `NullTransport`와 `FileTransport`는 피어
   의존성이 없음. `SmtpTransport`는 `nodemailer`를 느리게 로드. `mjml`
   도 느리게 로드됨.
3. **배치 발송.** 단일 호출로 여러 수신자에게 동일한 메시지 발송.
4. **MJML 템플릿.** 선택적 `mjml` 패키지로 반응형 HTML 이메일 템플릿
   렌더링.

## 참고

- [`../user-guide/mail.ko.md`](../user-guide/mail.ko.md) — 사용자 가이드
- [`../user-guide/queue.ko.md`](../user-guide/queue.ko.md) — 큐 모듈 (지연 발송용)
- [`../user-guide/view-engines.ko.md`](../user-guide/view-engines.ko.md) — 템플릿 렌더링
