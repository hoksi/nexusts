/**
 * 35-standard-decorators — NexusTS with TC39 standard ES decorators.
 *
 * This example demonstrates the framework using standard decorators
 * (no `experimentalDecorators`, no `reflect-metadata`).
 *
 * Controller methods receive `ctx` (Hono Context) and use the
 * InputValue helper directly instead of @Param/@Body/@Query.
 *
 * Run with:
 *   bun --tsconfig-override tsconfig.json main.ts
 *
 * Where tsconfig.json has:
 *   { "compilerOptions": { "experimentalDecorators": false } }
 */
import { Application, Controller, Get, Module, inputValue } from "@nexusts/core";
import { Injectable, Inject } from "@nexusts/core/di/standard-inject";
import type { Context } from "hono";

// ── Services ──

@Injectable()
class Logger {
	log(msg: string) {
		return `[log] ${msg}`;
	}
}

@Injectable()
class UserService {
	@Inject(Logger) logger!: Logger;

	getUser(id: number) {
		return {
			id,
			name: `User #${id}`,
			log: this.logger.log(`fetched user ${id}`),
		};
	}

	allUsers() {
		return [
			{ id: 1, name: "Alice" },
			{ id: 2, name: "Bob" },
		];
	}
}

// ── Controllers ──

@Controller("/")
class HelloController {
	@Get("/")
	index(ctx: Context) {
		return "Hello from NexusTS (standard decorators)!";
	}

	@Get("/json")
	json(ctx: Context) {
		return {
			message: "Hello",
			framework: "NexusTS",
			decorators: "standard",
		};
	}
}

@Controller("/users")
class UserController {
	@Inject(UserService) userService!: UserService;

	@Get("/")
	list(ctx: Context) {
		return ctx.json(this.userService.allUsers());
	}

	@Get("/:id")
	show(ctx: Context) {
		const id = inputValue(ctx.req.param("id"))
			.number()
			.required()
			.value();
		return ctx.json(this.userService.getUser(id));
	}
}

// ── Module ──

@Module({
	controllers: [HelloController, UserController],
	providers: [Logger, UserService],
})
class AppModule {}

// ── Bootstrap ──

const app = new Application(AppModule);
const port = Number(process.env.PORT ?? 3000);
console.log(`Server listening on http://localhost:${port}`);
await app.listen(port);