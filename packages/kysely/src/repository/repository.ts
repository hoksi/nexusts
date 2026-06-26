/**
 * `KyselyRepository` — Lucid-style repository pattern for Kysely.
 *
 * Subclass it with your DB schema type to get typed CRUD operations.
 * Works with Kysely's type-safe query builder.
 *
 * @example
 * ```ts
 * interface DB {
 *   users: {
 *     id: Generated<number>;
 *     email: string;
 *     name: string;
 *   };
 * }
 *
 * @Injectable()
 * class UserRepository extends KyselyRepository<DB, "users"> {
 *   @Inject(KyselyService.TOKEN) declare db: KyselyService<DB>;
 *   protected readonly tableName = "users";
 * }
 * ```
 */
import type { KyselyService } from "../kysely.service.js";
import type { DatabaseSchema } from "../types.js";

export type WhereCallback = (qb: any) => any;

export interface FindAllOptions {
  where?: WhereCallback;
  limit?: number;
  offset?: number;
  orderBy?: any | any[];
}

export class KyselyRepository<
  DB extends DatabaseSchema = any,
  TB extends keyof DB & string = string,
> {
  /**
   * Kysely service instance. Subclasses must inject this via `@Inject`.
   */
  protected readonly db!: KyselyService<DB>;

  /**
   * Table name for this repository. Subclasses must set this.
   */
  protected readonly tableName!: TB;

  constructor(db?: KyselyService<DB>, tableName?: TB) {
    if (db !== undefined) (this as any).db = db;
    if (tableName !== undefined) (this as any).tableName = tableName;
  }

  /** Kysely select query builder for this table. */
  protected get qb() {
    return this.db.selectFrom(this.tableName);
  }

  /** Returns all rows matching the given options. */
  async findAll(opts: FindAllOptions = {}): Promise<DB[TB][]> {
    let query = this.qb.selectAll();

    if (opts.where) {
      query = query.where(opts.where) as any;
    }
    if (opts.orderBy) {
      const arr = Array.isArray(opts.orderBy) ? opts.orderBy : [opts.orderBy];
      query = query.orderBy(arr) as any;
    }
    if (opts.limit !== undefined) {
      query = query.limit(opts.limit) as any;
    }
    if (opts.offset !== undefined) {
      query = query.offset(opts.offset) as any;
    }

    return query.execute() as Promise<DB[TB][]>;
  }

  /** Returns the first row matching the where callback. */
  async findOne(where: WhereCallback): Promise<DB[TB] | undefined> {
    const rows = await this.findAll({ where, limit: 1 });
    return rows[0];
  }

  /** Find by primary key (assumes `id` column). */
  async findById(id: number | string): Promise<DB[TB] | undefined> {
    const rows = await this.qb.selectAll()
      .where("id" as any, "=", id)
      .limit(1)
      .execute();
    return rows[0] as DB[TB] | undefined;
  }

  /** Insert a row and return it (requires RETURNING support). */
  async create(values: Partial<DB[TB]>): Promise<DB[TB] | undefined> {
    const rows = await this.db
      .insertInto(this.tableName)
      .values(values as any)
      .returningAll()
      .execute();
    return rows[0] as DB[TB] | undefined;
  }

  /** Insert multiple rows and return them. */
  async createMany(values: Array<Partial<DB[TB]>>): Promise<DB[TB][] | undefined> {
    if (values.length === 0) return [];
    const rows = await this.db
      .insertInto(this.tableName)
      .values(values as any)
      .returningAll()
      .execute();
    return rows as DB[TB][];
  }

  /** Update rows matching the where callback. */
  async update(where: WhereCallback, patch: Partial<DB[TB]>): Promise<DB[TB][]> {
    const rows = await this.db
      .updateTable(this.tableName)
      .set(patch as any)
      .where(where)
      .returningAll()
      .execute();
    return rows as DB[TB][];
  }

  /** Update by primary key (assumes `id` column). */
  async updateById(id: number | string, patch: Partial<DB[TB]>): Promise<DB[TB] | undefined> {
    const rows = await this.db
      .updateTable(this.tableName)
      .set(patch as any)
      .where("id" as any, "=", id)
      .returningAll()
      .execute();
    return rows[0] as DB[TB] | undefined;
  }

  /** Delete rows matching the where callback. */
  async delete(where: WhereCallback): Promise<number> {
    const result = await this.db
      .deleteFrom(this.tableName)
      .where(where)
      .execute();
    return Number(result[0]?.numDeletedRows ?? 0);
  }

  /** Delete by primary key (assumes `id` column). */
  async deleteById(id: number | string): Promise<boolean> {
    const result = await this.db
      .deleteFrom(this.tableName)
      .where("id" as any, "=", id)
      .executeTakeFirst();
    return Number((result as any)?.numDeletedRows ?? 0) > 0;
  }

  /** Count all rows (or matching the where callback). */
  async count(where?: WhereCallback): Promise<number> {
    let query = this.db.selectFrom(this.tableName) as any;
    query = query.select((qb: any) => qb.fn.countAll<number>().as("count"));
    if (where) {
      query = query.where(where);
    }
    const row = await query.executeTakeFirst();
    return Number((row as any)?.count ?? 0);
  }

  /** Run a callback inside a transaction. */
  async transaction<T>(
    fn: (tx: KyselyRepository<DB, TB>) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(async (trx) => {
      const txRepo = Object.create(this) as KyselyRepository<DB, TB>;
      Object.defineProperty(txRepo, "db", { value: { ...this.db, selectFrom: trx.selectFrom, insertInto: trx.insertInto, updateTable: trx.updateTable, deleteFrom: trx.deleteFrom }, writable: false });
      // Override the qb getter to use the transaction
      Object.defineProperty(txRepo, "qb", {
        get() {
          return (trx as any).selectFrom(this.tableName);
        },
        enumerable: true,
        configurable: true,
      });
      return fn(txRepo);
    });
  }
}
