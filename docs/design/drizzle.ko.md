# Drizzle ORM 모듈 — 디자인 문서

> English version: [`drizzle.md`](./drizzle.md)

이 문서는 `@kabyeon/nexusjs/drizzle`의 아키텍처를 설명합니다:
서비스 래퍼, 드라이버 추상화, 모델/리포지토리 패턴, 데코레이터 기반
테이블 정의.

## 목표

1. **멀티 다이얼렉트, 하나의 API.** PostgreSQL, MySQL, SQLite, Bun SQLite,
   Cloudflare D1 — 모두 동일한 `DrizzleService` 퍼사드 뒤에서.
2. **자동 종료 가능.** `DrizzleService`는 애플리케이션 생명주기 훅
   (`onAppClose`)을 구현하여 수동 정리 없이 데이터베이스 연결이 정리됨.
3. **모델 + 리포지토리 패턴.** 데코레이터로 테이블 정의(`@Table`, `@Column`,
   `@PrimaryKey`)하고 `DrizzleRepository<T>`를 통해 타입드 CRUD 계층으로
   데이터 접근.
4. **Raw 쿼리 탈출구.** 쿼리 빌더에 맞지 않는 SQL 문을 위한 `rawQuery()`.
5. **프레임워크 DI 통합.** `DrizzleModule.forRoot(config)`가 서비스를
   컨테이너에 연결하여 모든 `@Injectable()` 서비스가 주입 가능.

## 참고

- [`../user-guide/drizzle.ko.md`](../user-guide/drizzle.ko.md) — 사용자 가이드
- [`../user-guide/database.ko.md`](../user-guide/database.ko.md) — 데이터베이스 개요
