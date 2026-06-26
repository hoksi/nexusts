/**
 * Kysely model template.
 *
 * Generates a typed table interface + KyselyRepository subclass
 * using `@nexusts/kysely`'s `KyselyRepository` and `KyselyService`.
 *
 * Context:
 *   name        — PascalCase (e.g. "User")
 *   camel       — camelCase (e.g. "user")
 *   snake       — snake_case (e.g. "user")
 *   tableName   — snake_case plural (e.g. "users")
 *   columns     — rendered column definitions
 */

export default `
import type { Generated, Insertable, Selectable, Updateable } from 'kysely';
import { Inject, Injectable } from '@nexusts/core';
import { KyselyService, KyselyRepository } from '@nexusts/kysely';

/**
 * Table interface for {{ tableName }}.
 */
export interface {{ name }}Table {
  id: Generated<number>;
{{ columns }}
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

/** Row types derived from the table interface. */
export type {{ name }}       = Selectable<{{ name }}Table>;
export type New{{ name }}    = Insertable<{{ name }}Table>;
export type {{ name }}Update = Updateable<{{ name }}Table>;

/**
 * Repository for {{ tableName }} — Lucid-style CRUD via KyselyRepository.
 */
@Injectable()
export class {{ name }}Repository extends KyselyRepository<any, '{{ tableName }}'> {
  @Inject(KyselyService.TOKEN) declare db: KyselyService<any>;
  protected readonly tableName = '{{ tableName }}' as const;
}
`.trimStart();
