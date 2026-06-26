# @nexusts/kysely — Design & Architecture

> 한국어 버전: [`kysely.ko.md`](./kysely.ko.md)

## Overview

`@nexusts/kysely` provides a first-party integration with [Kysely](https://kysely.dev/),
a type-safe SQL query builder for TypeScript. Kysely fixes SQL's traditional
weaknesses in TypeScript by providing compile-time type checking for table
names, column names, join conditions, and result types — all inferred from
a simple TypeScript interface.

## Why Kysely?

NexusTS already ships `@nexusts/drizzle` as the default ORM. Adding Kysely as a
second first-party database module fills a different use case:

1. **SQL-first development** — Users who prefer writing SQL queries with
   full type safety over ORM-style table objects
2. **Maximum compile-time safety** — Kysely's type system catches wrong
   column names, table names, and type mismatches at compile time
3. **No code generation** — Unlike Prisma or Drizzle Kit, Kysely works
   from plain TypeScript interfaces — no CLI, no schema files, no `prisma generate`
4. **Lightweight** — Kysely itself is ~50KB gzipped with zero runtime
   dependencies beyond the dialect drivers
5. **Kysely Migrator** — Built-in, no external CLI needed

## Architecture

```
@nexusts/core
    └── @nexusts/kysely
         ├── KyselyModule.forRoot(config)    ← Dynamic module registration
         ├── KyselyService<DB>               ← Wraps Kysely instance
         │   ├── selectFrom(table)           → Kysely's SelectQueryBuilder
         │   ├── insertInto(table)           → Kysely's InsertQueryBuilder
         │   ├── updateTable(table)          → Kysely's UpdateQueryBuilder
         │   ├── deleteFrom(table)           → Kysely's DeleteQueryBuilder
         │   ├── schema                      → Kysely's SchemaBuilder
         │   ├── transaction(fn)             → Kysely's Transaction
         │   └── migrate()                   → Kysely's Migrator
         └── KyselyRepository<DB, TB>        ← Lucid-style CRUD
              ├── findAll / findOne / findById
              ├── create / createMany
              ├── update / updateById
              ├── delete / deleteById
              ├── count
              └── transaction
```

## Key Design Decisions

### 1. Lazy Initialization

KyselyService initializes the underlying `Kysely` instance lazily via
`open()` / `getDb()`. This allows:

- Module registration without blocking on database connections
- Clear error messages if accessed before initialization
- Integration with NexusTS DI lifecycle hooks

### 2. Optional Peer Dependency

`kysely` is an optional peer dependency, exactly like `drizzle-orm` in
`@nexusts/drizzle` and `graphql` in `@nexusts/graphql`. This ensures:

- No forced install for users who don't need Kysely
- Clear error message with install command if accessed

### 3. Dynamic Import Pattern

Kysely is loaded via `import("kysely")` at runtime, not at module load
time. This follows the peer-dependency pattern established by `@nexusts/graphql`.

### 4. Transaction Scoping

Transactions create a lightweight proxy object that keeps the same
method signature but routes queries through the Kysely `Transaction<DB>`
object. This ensures:

- Type safety is preserved inside transactions
- The transaction is committed on success, rolled back on error
- Nested transactions are handled by Kysely's internal savepoint support

### 5. Repository Pattern

`KyselyRepository` mirrors `DrizzleRepository` in `@nexusts/drizzle`.
Both follow the Lucid-style pattern from AdonisJS:

- Thin wrapper that doesn't fight the underlying query builder
- `where` is a callback (not an expression tree) for maximum flexibility
- Transaction support with scoped repository instances

### 6. Migration Support

Kysely's built-in `Migrator` class is exposed through `KyselyService.migrate()`.
The `FileMigrationProvider` reads `.ts`/`.js` files from a folder — no
external CLI needed.

## Module Registration

### `KyselyModule.forRoot(config)`

```ts
KyselyModule.forRoot({
  config: { dialect: new SqliteDialect({ database: new Database("app.db") }) },
  migrations: {
    provider: new FileMigrationProvider({ fs, path, migrationFolder: "./migrations" }),
    autoMigrate: true,
  },
  logging: true,
})
```

- `config.dialect` — Any Kysely dialect (SqliteDialect, PostgresDialect, MysqlDialect, etc.)
- `config.pool` — Optional pool configuration (for PostgreSQL/MySQL)
- `migrations.provider` — Kysely MigrationProvider (FileMigrationProvider for files, your own for custom sources)
- `migrations.autoMigrate` — Auto-run pending migrations on boot
- `logging` — Enable query logging to console

### `KyselyModule.forRootAsync(opts)`

For dialects requiring async initialization (e.g., PostgreSQL with
pool config from environment), use the async variant:

```ts
KyselyModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    config: {
      dialect: new PostgresDialect({
        pool: new Pool({ connectionString: config.get("DATABASE_URL") }),
      }),
    },
  }),
})
```

## Error Handling

| Scenario | Error Message |
|----------|---------------|
| Accessed before open() | `[kysely] service not opened. Call open() or await getDb() first.` |
| migrate() without provider | `[kysely] No migration provider configured. Pass migrations: { provider: ... }` |
| Kysely peer-dep not installed | `[@nexusts/kysely] 'kysely' is required. Install with 'bun add kysely'.` |

## Comparison with Drizzle

| Aspect | Kysely | Drizzle |
|--------|--------|---------|
| Type safety | Compile-time via `DB` interface | Runtime table objects + `$inferSelect` |
| Query syntax | `db.selectFrom('t').where('c', '=', v)` | `db.select().from(t).where(eq(t.c, v))` |
| Table schema | TypeScript `interface` | `pgTable()` / `sqliteTable()` |
| Migrations | Kysely Migrator (built-in, code) | Drizzle Kit (external CLI, SQL) |
| Raw queries | `sql\`...\`` template tag | `sql\`...\`` template tag |
| Bundle overhead | Kysely + dialect driver | Drizzle ORM + dialect driver |
| Dialect support | All Kysely dialects | 5 built-in dialects |
| Code gen | None | Optional (drizzle-kit generate) |

## Future Directions

- Support for Kysely's built-in TypeProvider for Zod/Valibot integration
- Automatic repository generation from DB schema (like DrizzleEntity)
- Connection pooling lifecycle hooks for graceful shutdown
- Multi-tenant database support via `@nexusts/tenant`

## See Also

- [Kysely User Guide](../user-guide/kysely.md)
- [Drizzle Design Doc](./drizzle.md)
- [Database User Guide](../user-guide/database.md)
