/**
 * `BunSqliteDialect` — a Kysely dialect for Bun's built-in `bun:sqlite`.
 *
 * Kysely's built-in `SqliteDialect` requires `better-sqlite3`, which
 * does not work in Bun. This lightweight wrapper patches the `.reader`
 * property onto prepared statements, so Kysely's `SqliteDialect` can
 * distinguish SELECT queries from INSERT/UPDATE/DELETE.
 *
 * @example
 * ```ts
 * import { Kysely, SqliteDialect } from "kysely";
 * import { Database } from "bun:sqlite";
 * import { BunSqliteDialect } from "@nexusts/kysely";
 *
 * const db = new Kysely({
 *   dialect: new SqliteDialect({
 *     database: BunSqliteDialect.wrap(new Database("app.db")),
 *   }),
 * });
 * ```
 */
export class BunSqliteDialect {
  /**
   * Wrap a Bun SQLite `Database` instance so it works with Kysely's
   * `SqliteDialect`.
   *
   * The returned object has the same interface as a
   * `better-sqlite3.Database` — Kysely's SqliteDriver checks
   * `stmt.reader` to decide whether to call `stmt.all()` (SELECT) or
   * `stmt.run()` (INSERT/UPDATE/DELETE). Bun's `bun:sqlite` doesn't
   * expose this property, so we inject it by analyzing the SQL text.
   *
   * @param db - A `bun:sqlite` `Database` instance
   * @returns A wrapped database compatible with `SqliteDialect`
   */
  static wrap(db: any): any {
    const proto = Object.getPrototypeOf(db);
    const origPrepare = proto.prepare.bind(db);

    // Override `prepare` on the instance so each Statement gets a
    // synthetic `.reader` property matching Kysely's expectations.
    db.prepare = function (this: any, sql: string) {
      const stmt = origPrepare(sql);
      Object.defineProperty(stmt, "reader", {
        value: /^\s*(?:select|pragma|with|explain)\b/i.test(sql),
        writable: false,
      });
      return stmt;
    };

    return db;
  }

  /**
   * Create a new in-memory Bun SQLite database, pre-wrapped for Kysely.
   *
   * @returns A wrapped `Database(":memory:")` instance
   */
  static async inMemory(): Promise<any> {
    const { Database } = await requireBunSqlite();
    return BunSqliteDialect.wrap(new Database(":memory:"));
  }

  /**
   * Create a new file-based Bun SQLite database, pre-wrapped for Kysely.
   *
   * @param filename - Path to the SQLite database file
   * @returns A wrapped `Database(filename)` instance
   */
  static async file(filename: string): Promise<any> {
    const { Database } = await requireBunSqlite();
    return BunSqliteDialect.wrap(new Database(filename));
  }
}

let _mod: any = null;
async function requireBunSqlite(): Promise<{ Database: any }> {
  if (_mod) return _mod;
  try {
    _mod = await import("bun:sqlite");
    return _mod;
  } catch {
    throw new Error(
      "[@nexusts/kysely] `bun:sqlite` is only available in Bun. " +
      "This dialect requires the Bun runtime.",
    );
  }
}
