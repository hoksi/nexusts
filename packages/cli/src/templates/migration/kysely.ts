/**
 * Kysely migration template.
 *
 * Generates a TypeScript migration file with `up()` and `down()`
 * functions compatible with Kysely's built-in Migrator.
 *
 * Context:
 *   name        — PascalCase model name (e.g. "CreateUsersTable")
 *   tableName   — snake_case plural table (e.g. "users")
 *   columns     — column definitions (rendered by command)
 *   timestamp   — ISO timestamp prefix used in the filename
 */
export default `
import type { Kysely } from 'kysely';

/**
 * Migration: {{ name }}
 *
 * Run with \`nx db:migrate\` or via Kysely's Migrator.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('{{ tableName }}')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
{{ columns }}
    .addColumn('created_at', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('updated_at', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('{{ tableName }}').execute();
}
`.trimStart();
