/**
 * Application bootstrap.
 *
 * Run with:
 *   bun run dev
 *
 * Listens on port 3000 by default. Try:
 *   curl http://localhost:3000/users
 *   curl -X POST http://localhost:3000/users -H "Content-Type: application/json" \
 *        -d '{"name":"Carol","email":"carol@example.com"}'
 */
import "reflect-metadata";
import { Application } from "../core/application.js";
import { AppModule } from "./app.module.js";

const app = new Application(AppModule, {
	logging: true,
});

console.log("[nexus] Routes registered. Listening on :3000");
await app.listen(3000);
