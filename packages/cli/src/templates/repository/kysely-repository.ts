/**
 * Kysely repository template.
 *
 * Uses `@nexusts/kysely`'s `KyselyRepository` with field injection.
 *
 * Context:
 *   name          — PascalCase class name
 *   camel         — camelCase variable
 *   kebab         — kebab-case
 *   tableName     — plural snake_case table name
 *   snake         — singular snake_case
 *   repository    — PascalCase repository name
 */

export default `
import { Injectable, Inject } from '@nexusts/core';
import { KyselyService, KyselyRepository } from '@nexusts/kysely';

@Injectable()
export class {{ repository }} extends KyselyRepository<any, '{{ tableName }}'> {
  @Inject(KyselyService.TOKEN) declare db: KyselyService<any>;
  protected readonly tableName = '{{ tableName }}' as const;
}
`.trimStart();
