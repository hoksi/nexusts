/**
 * Inertia demo bootstrap.
 *
 * Wires the InertiaDemoController and FormDemoController into a tiny app
 * and starts it on port 3301 (to avoid clashing with the default
 * `bun src/app/main.ts` instance).
 */
import "reflect-metadata";
import { Application } from "../core/application.js";
import { Module } from "../core/decorators/module.js";
import { FormDemoController } from "./controllers/form-demo.controller.js";
import { InertiaDemoController } from "./controllers/inertia-demo.controller.js";

@Module({
	controllers: [InertiaDemoController, FormDemoController],
})
class InertiaDemoModule {}

const app = new Application(InertiaDemoModule, {
	inertia: {
		version: "1",
		title: "Inertia Demo",
		sharedProps: () => ({
			appName: "Nexus Inertia Demo",
			csrfToken: "demo-csrf-token",
		}),
	},
});

(globalThis as any).__users = [
	{ id: 1, name: "Alice" },
	{ id: 2, name: "Bob" },
	{ id: 3, name: "Carol" },
];

console.log("[inertia-demo] listening on :3301");
console.log("  GET  /inertia");
console.log("  GET  /inertia/dashboard");
console.log("  GET  /inertia/users");
console.log("  GET  /inertia/profile");
console.log("  GET  /inertia/back");
console.log("  POST /inertia/logout");
console.log("  GET  /form-demo/users");
console.log("  POST /form-demo/users");
console.log("  POST /form-demo/users/quick");
await app.listen(3301);
