import "reflect-metadata";
import { Application, Controller, Get, Module, Injectable, Inject } from "@kabyeon/nexusjs";

/**
 * 02-routing-styles — three ways to register routes in the same app.
 *
 *   GET /              (Nest)
 *   GET /adonis        (Adonis)
 *   GET /hello/:name   (Functional)
 */

// ─── Style 1: Nest-style class decorator ──────────────────────────
@Controller("/")
class NestStyle {
  @Get("/")
  root() {
    return { style: "nest", message: "Class decorators" };
  }
}

// ─── Style 2: Adonis-style: router.add(method, path, ctrl, methodName) ─
@Controller("/adonis")
class AdonisStyle {
  list() {
    return { style: "adonis", message: "router.add registers a controller action" };
  }
}

// ─── Style 3: Functional: a raw Hono handler ─────────────────────
// Useful for middleware, dynamic routes, or Hono-native code.

// ─── Wire everything in a Module so we can show DI in main.ts too ──
@Injectable()
class AppService {
  greet(name: string) {
    return `Hello, ${name}!`;
  }
}

@Module({
  providers: [AppService],
})
class AppModule {}

const app = new Application(AppModule);

// Style 1 — registered automatically because the controller is
// added below via `registerController()`.
app.server.router.registerController(NestStyle);

// Style 2
app.server.router.add("GET", "/adonis", AdonisStyle, "list");

// Style 3 — resolve the service from DI and use it in a functional route
const svc = app.container.resolve(AppService);
app.server.router.raw("GET", "/hello/:name", (c) => {
  const name = c.req.param("name") ?? "world";
  return c.json({ style: "functional", message: svc.greet(name) });
});

await app.listen(3000);