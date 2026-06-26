# @nexusts/kysely — 설계 및 아키텍처

> English version: [`kysely.md`](./kysely.md)

## 개요

`@nexusts/kysely`는 [Kysely](https://kysely.dev/)를 퍼스트파티로 통합한 모듈입니다.
Kysely는 TypeScript를 위한 타입 안전 SQL 쿼리 빌더로, 테이블 이름, 컬럼 이름,
조인 조건, 결과 타입을 컴파일 타임에 검증합니다.

## Kysely를 선택한 이유

NexusTS는 이미 `@nexusts/drizzle`을 기본 ORM으로 제공합니다. Kysely를
두 번째 퍼스트파티 데이터베이스 모듈로 추가한 이유는 다음과 같습니다:

1. **SQL 우선 개발** — ORM 스타일 테이블 객체보다 SQL 쿼리에 익숙한 사용자
2. **최대 컴파일 타임 안전성** — 잘못된 컬럼명, 테이블명, 타입 불일치를 컴파일 타임에 발견
3. **코드 생성 불필요** — Prisma나 Drizzle Kit과 달리, TypeScript 인터페이스만으로 동작
4. **가벼움** — Kysely는 gzip 약 50KB, 런타임 의존성 제로
5. **내장 마이그레이터** — 외부 CLI 없이 사용 가능

## 아키텍처

```
@nexusts/core
    └── @nexusts/kysely
         ├── KyselyModule.forRoot(config)    ← 동적 모듈 등록
         ├── KyselyService<DB>               ← Kysely 인스턴스 래핑
         │   ├── selectFrom(table)           → Kysely SelectQueryBuilder
         │   ├── insertInto(table)           → Kysely InsertQueryBuilder
         │   ├── updateTable(table)          → Kysely UpdateQueryBuilder
         │   ├── deleteFrom(table)           → Kysely DeleteQueryBuilder
         │   ├── schema                      → Kysely SchemaBuilder
         │   ├── transaction(fn)             → Kysely Transaction
         │   └── migrate()                   → Kysely Migrator
         └── KyselyRepository<DB, TB>        ← Lucid 스타일 CRUD
```

## 주요 설계 결정

### 1. 지연 초기화

KyselyService는 `open()` / `getDb()`을 통해 지연 초기화합니다.
이를 통해:

- 데이터베이스 연결 없이 모듈 등록 가능
- 초기화 전 접근 시 명확한 에러 메시지 제공
- NexusTS DI 라이프사이클 훅과 통합 가능

### 2. 선택적 피어 의존성

`kysely`는 `@nexusts/drizzle`의 `drizzle-orm`, `@nexusts/graphql`의 `graphql`과
동일하게 선택적 피어 의존성입니다.

### 3. 동적 임포트 패턴

Kysely는 모듈 로드 시점이 아닌 런타임에 `import("kysely")`로 로드됩니다.

### 4. 트랜잭션 스코핑

트랜잭션은 Kysely의 `Transaction<DB>` 객체를 통해 쿼리를 라우팅하는
프록시 객체를 생성합니다.

### 5. 리포지토리 패턴

`KyselyRepository`는 `@nexusts/drizzle`의 `DrizzleRepository`와 동일한
Lucid 스타일 패턴을 따릅니다.

## 참고

- [Kysely 사용 가이드](../user-guide/kysely.md)
- [Drizzle 설계 문서](./drizzle.md)
