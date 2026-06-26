/**
 * `RawQuery` — parameterized raw SQL execution.
 *
 * Returned by `KyselyService.raw()` (not yet exposed on the service,
 * but available as a utility) and used internally by the repository
 * for COUNT queries.
 *
 * @example
 * ```ts
 * const rq = new RawQuery("SELECT * FROM users WHERE id = ?", [42], executor);
 * const rows = await rq.all();
 * const first = await rq.first();
 * ```
 */
import type { RawQueryResult } from "./types.js";

export interface RawExecutor {
  query: (sql: string, params: unknown[]) => Promise<RawQueryResult>;
  placeholder: (index: number) => string;
}

export class RawQuery<T = Record<string, unknown>> {
  readonly text: string;
  readonly params: unknown[];
  private readonly executor: RawExecutor;
  private readonly logger?: (sql: string, params: unknown[]) => void;

  constructor(
    text: string,
    params: unknown[],
    executor: RawExecutor,
    logger?: (sql: string, params: unknown[]) => void,
  ) {
    this.text = text;
    this.params = params;
    this.executor = executor;
    this.logger = logger;
  }

  /** Execute and return all rows. */
  async all<R = T>(): Promise<R[]> {
    this.logger?.(this.text, this.params);
    const result = await this.executor.query(this.text, this.params);
    return result.rows as R[];
  }

  /** Execute and return the first row, or undefined. */
  async first<R = T>(): Promise<R | undefined> {
    const rows = await this.all<R>();
    return rows[0];
  }

  /** Execute (for INSERT/UPDATE/DELETE) and return the result metadata. */
  async execute<R = T>(): Promise<RawQueryResult<R>> {
    this.logger?.(this.text, this.params);
    return this.executor.query(this.text, this.params) as Promise<RawQueryResult<R>>;
  }

  /** Return the SQL text with `?` placeholders. */
  toSQL(): string {
    return this.text;
  }

  /** Return the parameter values. */
  getParameters(): unknown[] {
    return [...this.params];
  }
}
