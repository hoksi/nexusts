/**
 * `nx make:listener <Name>` — scaffold an event listener class.
 *
 * Generates:
 *   - app/events/listeners/<name>.listener.ts
 *     — an @Injectable class with example @OnEvent handlers
 *
 * Usage:
 *   nx make:listener UserEvents
 *   nx make:listener OrderEvents --pattern "order.*"
 */

import { resolve } from "node:path";
import type { Command, CommandContext } from "../core/index.js";
import { logger, nameVariants, render, writeFile } from "../core/index.js";
import { templates } from "../templates/index.js";

export const makeListenerCommand: Command = {
	name: "make:listener",
	aliases: ["ml", "make-listener"],
	summary: "Scaffold an event listener class",
	description:
		"Generates an @Injectable listener class with example @OnEvent handlers under app/events/listeners/.",
	examples: ["nx make:listener UserEvents", "nx make:listener OrderEvents"],
	async run(ctx: CommandContext): Promise<number> {
		const name = ctx.positional[0];
		if (!name) {
			logger.error("Usage: nx make:listener <Name>");
			return 1;
		}

		const variants = nameVariants(name);
		const code = render(templates.listener, {
			name: variants.pascal,
			kebab: variants.kebab,
		});
		const out = resolve(
			ctx.cwd,
			"app/events/listeners",
			`${variants.kebab}.listener.ts`,
		);

		if (writeFile(out, code, { skipIfExists: true })) {
			logger.success(`created ${out}`);
		} else {
			logger.warn(`skipped (exists): ${out}`);
		}

		logger.blank();
		logger.heading("Next steps");
		logger.info("1. Add @OnEvent('your.event') handlers to the class.");
		logger.info(`2. Import + register at boot:`);
		logger.info(`     scanForListeners(listener, events)`);
		logger.info(`3. Emit events from anywhere:`);
		logger.info(`     await events.emit('user.created', { userId: '1' })`);
		logger.blank();

		return 0;
	},
};

export default makeListenerCommand;
