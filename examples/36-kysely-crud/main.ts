import { SqliteDialect } from "kysely";
import { Database } from "bun:sqlite";
import {
  Application, Module, Controller, Get, Post, Inject, Injectable, inputValue,
} from "@nexusts/core";
import { KyselyModule, KyselyService, KyselyRepository, BunSqliteDialect } from "@nexusts/kysely";
import type { Context } from "hono";

/**
 * 36-kysely-crud — type-safe SQLite CRUD with Kysely + bun:sqlite.
 *
 * Run: bun main.ts
 *
 * Try:
 *   curl -X POST http://localhost:3000/users \
 *     -H "Content-Type: application/json" \
 *     -d '{"name":"Alice","email":"alice@example.com","age":30}'
 *   curl http://localhost:3000/users
 *   curl http://localhost:3000/users/1
 */

// ─── 1. Schema type (Kysely style — pure TS interface) ────────────────
interface DB {
  users: {
    id: number;
    email: string;
    name: string;
    age: number;
  };
}

// ─── 2. Repository — Lucid-style typed CRUD ──────────────────────────
@Injectable()
export class UserRepository extends KyselyRepository<DB, "users"> {
  @Inject(KyselyService.TOKEN) declare db: KyselyService<DB>;
  protected readonly tableName = "users" as const;
}

// ─── 3. Controller ───────────────────────────────────────────────────
@Injectable()
@Controller("/users")
export class UserController {
  @Inject(UserRepository) declare users: UserRepository;
  @Inject(KyselyService.TOKEN) declare db: KyselyService<DB>;

  @Get("/")
  list() {
    return this.users.findAll({ orderBy: (qb: any) => qb.orderBy("id", "asc") });
  }

  @Get("/:id")
  async find(ctx: Context) {
    const id = inputValue(ctx.req.param("id")).number().required().value();
    return this.users.findById(id);
  }

  @Post("/")
  async create(ctx: Context) {
    const body = await ctx.req.json() as { email: string; name: string; age: number };
    return this.users.create(body as any);
  }
}

// ─── 4. Module wiring ────────────────────────────────────────────────
@Module({
  imports: [
    KyselyModule.forRoot({
      config: {
        dialect: new SqliteDialect({
          // BunSqliteDialect.wrap() patches Kysely's .reader requirement
          // onto bun:sqlite Statement objects so the SqliteDialect works
          // correctly with Bun's built-in SQLite.
          database: BunSqliteDialect.wrap(new Database("app.db")),
        }),
      },
      logging: true,
    }),
  ],
  controllers: [UserController],
  providers: [UserRepository],
})
class AppModule {}

// ─── 5. Bootstrap ────────────────────────────────────────────────────
const app = new Application(AppModule);

// Ensure the table exists (in real apps, use Kysely Migrator).
const db = await app.container.resolve(KyselyService.TOKEN);
await db.open();
await db.schema
  .createTable("users")
  .ifNotExists()
  .addColumn("id", "integer", (col: any) => col.primaryKey().autoIncrement())
  .addColumn("email", "varchar(255)", (col: any) => col.notNull().unique())
  .addColumn("name", "varchar(255)", (col: any) => col.notNull())
  .addColumn("age", "integer", (col: any) => col.notNull())
  .execute();

const port = Number(process.env.PORT ?? 3000);
await app.listen(port);
