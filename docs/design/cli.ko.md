# CLI 모듈 — 디자인 문서

> English version: [`cli.md`](./cli.md)

이 문서는 `@kabyeon/nexusjs/cli`의 아키텍처를 설명합니다:
`nx` 명령 실행기, 스캐폴드 생성기, 코드 템플릿, 설정 로더, REPL.

## 목표

1. **Adonis ACE 스타일 명령 실행기.** `nx make:controller User`,
   `nx make:crud Post`, `nx route:list`, `nx info` — Laravel/Adonis
   개발자에게 친숙한 규칙.
2. **스캐폴드 생성기.** `nx new my-app`이 스타일(nest, functional,
   adonis), 뷰 엔진(rendu, edge, inertia), ORM(drizzle, prisma, kysely)
   을 설정 가능한 완전한 프로젝트 생성.
3. **코드 생성.** `nx make:*` 명령이 일관된 템플릿으로 보일러플레이트
   파일(컨트롤러, 서비스, 모듈, 모델, 마이그레이션 등) 생성.
4. **프로젝트 인트로스펙션.** `nx info`는 런타임 환경 출력; `nx route:list`
   는 등록된 HTTP 라우트 출력; `nx config`는 `nx.config.ts` 출력.
5. **REPL.** `nx repl`이 애플리케이션 DI 컨테이너에 접근 가능한 대화형
   TypeScript REPL을 염.

## 참고

- [`../user-guide/cli.ko.md`](../user-guide/cli.ko.md) — 사용자 가이드
