# 35 — Standard Decorators Example

This example demonstrates NexusTS using TC39 standard ES decorators instead of the legacy `experimentalDecorators` mode.

## Key Differences

- **No `reflect-metadata` import** — standard decorators have built-in metadata via `context.metadata`
- **No `@Param`/`@Body`/`@Query` decorators** — controller methods receive `ctx` (Hono Context) directly, use `inputValue()` helper for typed input
- **Field injection** — `@Inject(Token) field!: Type` replaces `constructor(@Inject(Token) field: Type)`
- **Dual-mode compatible** — works with both `experimentalDecorators: true` (legacy) and `experimentalDecorators: false` (standard)

## How to Run

**Standard mode** (recommended):

```bash
bun --tsconfig-override ../../tsconfig.experiment.json main.ts
```

**Legacy mode** (falls back to reflect-metadata):

```bash
bun main.ts
```

## What It Shows

- `GET /` — Simple text response
- `GET /json` — JSON response  
- `GET /users` — List of users (via field-injected UserService)
- `GET /users/:id` — Single user by ID (via `inputValue(ctx.req.param("id"))`)
