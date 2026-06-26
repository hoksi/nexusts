/**
 * `KyselyModule` — typed SQL query builder integration.
 *
 * @example
 * ```ts
 * import { Module } from "@nexusts/core";
 * import { KyselyModule, KyselyService } from "@nexusts/kysely";
 * import { SqliteDialect } from "kysely";
 * import Database from "better-sqlite3";
 *
 * @Module({
 *   imports: [
 *     KyselyModule.forRoot({
 *       config: { dialect: new SqliteDialect({ database: new Database("app.db") }) },
 *       logging: true,
 *     }),
 *   ],
 * })
 * class AppModule {}
 * ```
 *
 * Then inject into any service:
 *
 * @Injectable()
 * class UserService {
 *   @Inject(KyselyService.TOKEN) declare db: KyselyService<MyDB>;
 *
 *   async findAll() {
 *     return this.db.selectFrom("users").selectAll().execute();
 *   }
 * }
 */
import { Module } from "@nexusts/core";
import { KyselyService } from "./kysely.service.js";
import type { KyselyModuleConfig } from "./types.js";

export class KyselyModule {
  /**
   * Register Kysely with configuration.
   *
   * @param opts - Module configuration (KyselyConfig + migrations + logging)
   * @returns A dynamic module class to be listed in `@Module({ imports: [...] })`
   */
  static forRoot(opts: KyselyModuleConfig): any {
    @Module({
      providers: [
        {
          provide: KyselyService.TOKEN,
          useFactory: () => new KyselyService(opts.config, {
            migrations: opts.migrations,
            logging: opts.logging,
          }),
        },
        { provide: KyselyService, useExisting: KyselyService.TOKEN },
        { provide: "KYSELY_CONFIG", useValue: opts.config },
        { provide: "KYSELY_OPTIONS", useValue: { migrations: opts.migrations, logging: opts.logging } },
      ],
      exports: [KyselyService.TOKEN, KyselyService, "KYSELY_CONFIG", "KYSELY_OPTIONS"],
    })
    class ConfiguredKyselyModule {}

    Object.defineProperty(ConfiguredKyselyModule, "name", { value: "ConfiguredKyselyModule" });
    return ConfiguredKyselyModule;
  }

  /**
   * Async variant using `useFactory` with dynamic import.
   * Useful when the dialect requires async initialization (e.g. PostgreSQL pool).
   */
  static forRootAsync(opts: {
    imports?: any[];
    useFactory: (...args: any[]) => KyselyModuleConfig | Promise<KyselyModuleConfig>;
    inject?: any[];
  }): any {
    @Module({
      imports: opts.imports ?? [],
      providers: [
        {
          provide: "KYSELY_ASYNC_CONFIG",
          useFactory: opts.useFactory,
          inject: opts.inject ?? [],
        },
        {
          provide: KyselyService.TOKEN,
          useFactory: async (...args: any[]) => {
            const resolvedConfig = args[args.length - 1] as KyselyModuleConfig;
            return new KyselyService(resolvedConfig.config, {
              migrations: resolvedConfig.migrations,
              logging: resolvedConfig.logging,
            });
          },
          inject: [...(opts.inject ?? []), "KYSELY_ASYNC_CONFIG"],
        },
        { provide: KyselyService, useExisting: KyselyService.TOKEN },
      ],
      exports: [KyselyService.TOKEN, KyselyService],
    })
    class ConfiguredKyselyModuleAsync {}

    Object.defineProperty(ConfiguredKyselyModuleAsync, "name", { value: "ConfiguredKyselyModuleAsync" });
    return ConfiguredKyselyModuleAsync;
  }
}
