/**
 * Demonstrates the three supported routing styles side by side.
 *
 * 1. **Nest style**     — `@Controller('/users')` + `@Get/@Post/@Post`
 * 2. **Adonis style**   — `router.get('/users', UserController, 'list')`
 * 3. **Functional**     — `router.get('/health', (c) => ...)`
 *
 * The router instance is obtained via `app.server.router` and the API
 * is the same regardless of style.
 */
import "reflect-metadata";
import { Application } from "../core/application.js";
import { Module } from "../core/decorators/module.js";
import { HomeController } from "./controllers/home.controller.js";
import { UserController } from "./controllers/user.controller.js";
import { UserService } from "./services/user.service.js";

@Module({
	controllers: [HomeController, UserController],
	providers: [UserService],
})
class DemoModule {}

const app = new Application(DemoModule);

// 3. Functional style — `router.raw(method, path, handler)`.
app.server.router.raw("GET", "/health", (c) =>
	c.json({ status: "ok", time: new Date().toISOString() }),
);

// 2. Adonis style — `router.add(method, path, Controller, methodName)`.
app.server.router.add("GET", "/users-count", UserController, "index");

console.log("[nexus-demo] listening on :3000");
await app.listen(3000);
