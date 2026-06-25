import {
  Application,
  Module,
  Controller,
  Get,
  Post,
  Inject,
  Injectable,
} from "@nexusts/core";
import { OpenAPIModule, ApiResponse, ApiBody } from "@nexusts/openapi";
import { z } from "zod";
import type { Context } from "hono";

/**
 * 05-openapi — auto-generated OpenAPI (Swagger) spec.
 *
 * Run: bun main.ts
 * Visit: http://localhost:3000/openapi
 *
 * This example demonstrates:
 *   - @ApiResponse({ status, description, schema })
 *   - @ApiBody({ description, schema }) using Zod
 *   - Automatic OpenAPI spec generation via @nexusts/openapi
 */

// ─── Schemas ────────────────────────────────────────────────────────
const User = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

const CreateUser = User.omit({ id: true });

// ─── Service ─────────────────────────────────────────────────────────
@Injectable()
export class UserService {
  findAll() {
    return [{ id: 1, name: "Alice", email: "alice@example.com" }];
  }

  findOne(id: number) {
    return { id, name: "Alice", email: "alice@example.com" };
  }

  create(data: z.infer<typeof CreateUser>) {
    return { id: Date.now(), ...data };
  }
}

// ─── Controller ──────────────────────────────────────────────────────
@Controller("/users")
export class UserController {
  @Inject(UserService) declare userService: UserService;

  @Get("/")
  @ApiResponse({ status: 200, description: "List of users", schema: User.array() })
  index(ctx: Context) {
    return this.userService.findAll();
  }

  @Get("/:id")
  @ApiResponse({ status: 200, description: "A single user", schema: User })
  show(ctx: Context) {
    const id = Number(ctx.req.param("id"));
    return this.userService.findOne(id);
  }

  @Post("/")
  @ApiBody({ description: "User data", schema: CreateUser })
  @ApiResponse({ status: 201, description: "Created user", schema: User })
  async create(ctx: Context) {
    const body = CreateUser.parse(await ctx.req.json());
    return { status: 201, body: this.userService.create(body) };
  }
}

// ─── Module ──────────────────────────────────────────────────────────
@Module({
  imports: [
    OpenAPIModule.forRoot({
      title: "My API",
      version: "1.0.0",
      path: "/openapi",
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
class AppModule {}

// ─── Bootstrap ──────────────────────────────────────────────────────
const app = new Application(AppModule);
await app.listen(Number(process.env.PORT ?? 3000));
