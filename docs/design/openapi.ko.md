# OpenAPI 모듈 — 디자인 문서

> English version: [`openapi.md`](./openapi.md)

이 문서는 `@kabyeon/nexusjs/openapi`의 아키텍처를 설명합니다:
Zod-to-JSON-Schema 변환, 데코레이터 기반 연산 메타데이터, Scalar UI
통합, 자동 생성 파이프라인.

## 목표

1. **컨트롤러 + Zod 스키마로부터 자동 생성된 OpenAPI 3.1 스펙.**
   수동 `openapi.json` 작성 불필요.
2. **Zod를 진실 공급원으로.** 요청 검증(`@Validate`)에 사용되는 동일한
   Zod 스키마가 API 문서화에도 재사용됨.
3. **데코레이터 기반 연산 메타데이터.** `@ApiOperation`, `@ApiResponse`,
   `@ApiParam`, `@ApiTags` — NestJS/Swagger 스타일.
4. **내장 Scalar UI.** `/openapi`는 JSON 스펙 제공; `/openapi/ui`는
   Scalar 기반의 아름다운 대화형 문서화 UI 제공.

## 참고

- [`../user-guide/openapi.ko.md`](../user-guide/openapi.ko.md) — 사용자 가이드
- [`../user-guide/validation.ko.md`](../user-guide/validation.ko.md) — Zod 검증 (Zod 스키마가 진실 공급원)
