/**
 * Types for `@nexusts/kysely` — typed SQL query builder integration.
 */
import type { KyselyConfig, MigrationProvider } from "kysely";

/**
 * Kysely database schema type — maps table names to their row types.
 * Users define this interface and pass it as a generic parameter.
 *
 * @example
 * ```ts
 * interface DB {
 *   users: {
 *     id: Generated<number>;
 *     email: string;
 *     name: string;
 *     created_at: Generated<string>;
 *   };
 *   posts: {
 *     id: Generated<number>;
 *     title: string;
 *     user_id: number;
 *   };
 * }
 *
 * const db = new KyselyService<DB>({ dialect: new SqliteDialect({...}) });
 * const user = await db.selectFrom('users')
 *   .where('id', '=', 42)
 *   .selectAll()
 *   .executeTakeFirst();
 * ```
 */
export type DatabaseSchema = Record<string, any>;

// ---------------------------------------------------------------------------
// Migration configuration
// ---------------------------------------------------------------------------

export interface KyselyMigrationsConfig {
  /** Migration provider (e.g. FileMigrationProvider). */
  provider: MigrationProvider;
  /** Table name for the migrations tracking table (default: 'kysely_migration'). */
  tableName?: string;
  /** Whether to auto-run migrations on boot. */
  autoMigrate?: boolean;
}

// ---------------------------------------------------------------------------
// Top-level module config
// ---------------------------------------------------------------------------

export interface KyselyModuleConfig {
  /** Kysely configuration (dialect + pool). */
  config: KyselyConfig;
  /** Optional migration configuration. */
  migrations?: KyselyMigrationsConfig;
  /** Enable query logging. */
  logging?: boolean | ((query: string, params: unknown[]) => void);
}

// ---------------------------------------------------------------------------
// Kysely service options (internal)
// ---------------------------------------------------------------------------

export interface KyselyServiceOptions {
  /** Optional migration configuration. */
  migrations?: KyselyMigrationsConfig;
  /** Enable query logging. */
  logging?: boolean | ((query: string, params: unknown[]) => void);
}

// ---------------------------------------------------------------------------
// Raw query result
// ---------------------------------------------------------------------------

export interface RawQueryResult<T = Record<string, unknown>> {
  rows: T[];
  /** Number of affected rows (UPDATE/DELETE/INSERT). */
  affectedRows: number;
  /** Insert ID (MySQL/SQLite/Postgres RETURNING). */
  insertId?: number | string | bigint;
}

// ---------------------------------------------------------------------------
// Migration records
// ---------------------------------------------------------------------------

export interface MigrationRecord {
  name: string;
  /** Timestamp when this migration was applied. */
  appliedAt: Date;
}

export interface MigrateResult {
  /** Newly-applied migrations. */
  applied: MigrationRecord[];
  /** Total migrations run. */
  total: number;
  /** Any migration errors. */
  errors: Array<{ name: string; error: unknown }>;
}

// ---------------------------------------------------------------------------
// Repository types
// ---------------------------------------------------------------------------

export type WhereExpression = any;
export type OrderByExpression = any;
export type ExpressionOrFactory = any;

export interface FindAllOptions {
  where?: (qb: any) => any;
  limit?: number;
  offset?: number;
  orderBy?: OrderByExpression | OrderByExpression[];
}
