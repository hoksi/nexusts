/**
 * Public entry point for `@nexusts/kysely`.
 *
 * Kysely is a type-safe SQL query builder for TypeScript.
 * This integration provides:
 *   - `KyselyService` — wraps a Kysely instance with DI support
 *   - `KyselyModule` — `forRoot()` / `forRootAsync()` module registration
 *   - `KyselyRepository` — Lucid-style repository pattern
 *
 * Kysely is an optional peer dependency. Install it with `bun add kysely`.
 */
export * from "./types.js";
export { KyselyService } from "./kysely.service.js";
export type { KyselyTransaction } from "./kysely.service.js";
export { KyselyModule } from "./kysely.module.js";
export { KyselyRepository } from "./repository/index.js";
export { RawQuery } from "./raw-query.js";
export type { RawExecutor } from "./raw-query.js";
export { BunSqliteDialect } from "./bun-sqlite-dialect.js";
