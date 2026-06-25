# Standard Decorator Migration Plan

> **Branch**: `feat/standard-decorators`
> **Goal**: Remove `reflect-metadata` dependency and migrate from legacy (`experimentalDecorators: true`) to TC39 standard ES decorators.
> **Status**: Planning Phase

---

## Why Migrate?

| 항목 | Legacy Decorators | Standard Decorators |
|------|------------------|-------------------|
| TypeScript 설정 | `experimentalDecorators: true` | 기본 (설정 불필요) |
| 런타임 의존성 | `reflect-metadata` 필수 | 불필요 |
| 표준 | TypeScript 전용 | TC39 stage-3 |
| 번들 크기 | `reflect-metadata` (~16KB) | 0 |
| Parameter decorator | ✅ 지원 | ❌ 미지원 |
| Property decorator | ✅ | ✅ (`field` decorator) |
| Metadata | `Reflect.getMetadata` | `Symbol.metadata` |
| `design:paramtypes` | ✅ (emitDecoratorMetadata) | ❌ 미지원 |

## Breaking Changes

1. **Parameter decorators 제거**: `@Inject()`, `@Body()`, `@Param()`, `@Query()`, `@Ctx()`, `@Upload()`, `@UploadedFile()` → `ctx.input.*` / `ctx.param()` / `ctx.query()` / `ctx.body()`
2. **`@Injectable` → `@Injectable()`**: 클래스/필드 decorator로 변경 (생성자 주입 → 필드 주입)
3. **`@Inject` → 프로퍼티 decorator**: 생성자 파라미터 → 클래스 필드
4. **`reflect-metadata` 제거**: 모든 패키지에서 삭제
5. **`experimentalDecorators`/`emitDecoratorMetadata` 제거**: tsconfig에서 삭제
6. **`design:paramtypes` 미사용**: DI 컨테이너가 타입 정보를 런타임에 추론하는 방식 변경

## Migration Phases

### Phase 0: Foundation — `ctx.input` Helper System (우선 구현)

Input validation/sanitization 체인 시스템:

```ts
// 새 API
const id = ctx.param("id").number().required().value();
const name = ctx.query("name").trim().max(100).value();
const body = ctx.body.parse(CreateUserSchema);
```

**Files to create:**

- `packages/core/src/http/input-value.ts` — `InputValue` 체이닝 클래스
- `packages/core/src/http/input.ts` — `ctx.input`, `ctx.param()`, `ctx.query()`, `ctx.body()` 확장
- `tests/core/input-value.test.ts`

### Phase 1: DI Container Refactoring

변경 사항:

- `DIContainer`가 `design:paramtypes` 없이도 의존성 해결 가능하도록
- `@Inject()` field decorator 지원 (Token 기반)
- `@Injectable()` → 표준 class decorator

```ts
// Before (legacy):
@Injectable()
class UserService {
  constructor(
    @Inject('DB') private db: Database,
    private logger: LoggerService  // auto-wired via design:paramtypes
  ) {}
}

// After (standard):
@Injectable()
class UserService {
  @Inject('DB') declare db: Database;
  @Inject() declare logger: LoggerService;
}
```

### Phase 2: Core Decorators → 표준

변경할 decorator 목록:

| Decorator | 현재 방식 | 표준 방식 |
|-----------|----------|-----------|
| `@Module({...})` | ClassDecorator | class decorator |
| `@Controller('/')` | ClassDecorator | class decorator |
| `@Injectable()` | ClassDecorator | class + field decorator |
| `@Get('/')` | MethodDecorator | method decorator |
| `@Post('/')` | MethodDecorator | method decorator |
| `@Inject(token)` | ParameterDecorator → FieldDecorator | ❌ parameter → ✅ field |
| `@Body()` | ParameterDecorator → 제거 | `ctx.body()` |
| `@Param('id')` | ParameterDecorator → 제거 | `ctx.param('id')` |
| `@Query('page')` | ParameterDecorator → 제거 | `ctx.query('page')` |
| `@Ctx()` | ParameterDecorator → 제거 | `ctx` 직접 사용 |
| `@Upload()` | ParameterDecorator → 제거 | `ctx.upload()` |
| `@UploadedFile()` | ParameterDecorator → 제거 | `ctx.uploadedFile()` |

### Phase 3: 패키지별 마이그레이션

순서:

1. `@nexusts/core` — DI, 컨트롤러, 라우터, 데코레이터
2. `@nexusts/cli` — 스캐폴드 템플릿, REPL
3. `@nexusts/drizzle` — `DrizzleModel`, `DrizzleRepository`
4. `@nexusts/graphql` — `@Resolver`, `@Query`, `@Mutation`, `@Arg`
5. `@nexusts/grpc` — `@GrpcMethod`, `@GrpcServerStream` 등
6. `@nexusts/resilience` — `@Retry`, `@CircuitBreaker`, `@Bulkhead`
7. 외 25개 패키지
8. 모든 examples/ — 34개 예제 업데이트
9. 모든 tests/

### Phase 4: reflect-metadata 제거

- 모든 `package.json`에서 `reflect-metadata` 종속성 제거
- 모든 `import 'reflect-metadata'` 문 제거
- 모든 tsconfig에서 `experimentalDecorators`, `emitDecoratorMetadata` 제거
- `tsconfig.typecheck.json`에서 관련 설정 제거

### Phase 5: 테스트 및 CI

- 전체 테스트 스위트 통과 확인 (314+ tests)
- Smoke tests 통과 확인 (69 tests)
- CI 워크플로우 업데이트
- 문서 업데이트

## 타임라인 예상

| Phase | 예상 시간 | 설명 |
|-------|----------|------|
| Phase 0 (Foundation) | 1-2일 | InputValue, ctx helper |
| Phase 1 (DI) | 2-3일 | DI 컨테이너 리팩토링 |
| Phase 2 (Core decorators) | 3-5일 | 코어 패키지 마이그레이션 |
| Phase 3 (패키지) | 5-7일 | 32개 패키지 |
| Phase 4 (reflect-metadata 제거) | 1일 | 종속성 제거 |
| Phase 5 (테스트) | 2-3일 | 테스트 수정 및 CI |
| **Total** | **~14-21일** | |

---

## Phase 0: 상세 구현 계획

### `InputValue` 클래스

```ts
class InputValue<T = any> {
  constructor(private raw: T) {}
  
  trim(): InputValue<string> { ... }
  xss(): InputValue<string> { ... }
  htmlEscape(): InputValue<string> { ... }
  number(): InputValue<number> { ... }
  required(): InputValue<T> { ... }
  max(length: number): InputValue<string> { ... }
  min(length: number): InputValue<string> { ... }
  default(val: T): InputValue<T> { ... }
  value(): T { return this.raw; }
}
```

### `Context` 확장

```ts
// packages/core/src/http/context.ts 에 추가
declare module 'hono' {
  interface Context {
    input: InputHelper;
    param(name: string): InputValue;
    query(name: string): InputValue;
    body(): Promise<any>;
    body(schema: ZodSchema): Promise<any>;
    validate<T>(schema: ZodSchema<T>): T;
    upload(name: string): UploadValue;
    uploadedFile(name: string): File | undefined;
  }
}
```

### 컨트롤러 예시 (변경 후)

```ts
import { Controller, Get, Post, Injectable } from '@nexusts/core';
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

@Controller('/users')
export class UserController {
  @Inject('UserService') declare userService: UserService;

  @Get('/:id')
  show(ctx: Context) {
    const id = ctx.param('id').number().required().value();
    return this.userService.findById(id);
  }

  @Post('/')
  async create(ctx: Context) {
    const input = await ctx.validate(CreateUserSchema);
    return this.userService.create(input);
  }
}
```

---

## 보류 결정

- `@Cron`, `@Interval`, `@Timeout` — 이미 metadata-only 패턴이라 표준 방식으로 자연스럽게 변경 가능
- `@OnEvent` — 동일
- `@Retry`, `@CircuitBreaker`, `@Bulkhead` — 이미 metadata-only + eager apply 패턴
- Inertia `@Inject(Inertia.TOKEN)` — 프로퍼티 decorator로 변경
