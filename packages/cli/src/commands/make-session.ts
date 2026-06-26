/**
 * `nx make:session <Name>` — scaffold a session helper class.
 *
 * Generates:
 *   - app/session/services/<name>.session.ts
 *     — an @Injectable class with example session helpers
 *
 * Usage:
 *   nx make:session Cart
 *   nx make:session Flash --data "message: string"
 */

import { resolve } from "node:path";
import type { Command, CommandContext } from "../core/index.js";
import { logger, nameVariants, render, writeFile } from "../core/index.js";
import { templates } from "../templates/index.js";

export const makeSessionCommand: Command = {
	name: "make:session",
	aliases: ["msess", "make-session"],
	summary: "Scaffold a session helper class",
	description:
		"Generates an @Injectable session helper under app/session/services/.",
	examples: ["nx make:session Cart", "nx make:session Flash"],
	async run(ctx: CommandContext): Promise<number> {
		const name = ctx.positional[0];
		if (!name) {
			logger.error("Usage: nx make:session <Name>");
			return 1;
		}

		const variants = nameVariants(name);
		const code = render(templates.session, {
			name: variants.pascal,
			kebab: variants.kebab,
		});
		const out = resolve(
			ctx.cwd,
			`${ctx.config.paths.app}/session/services`,
			`${variants.kebab}.session.ts`,
		);

		if (writeFile(out, code, { skipIfExists: true })) {
			logger.success(`created ${out}`);
		} else {
			logger.warn(`skipped (exists): ${out}`);
		}

		logger.blank();
		logger.heading("Next steps");
		logger.info("1. Define the typed payload (replace the TODO interface).");
		logger.info(`2. Inject {{name}}Session in your controllers / services.`);
		logger.info("3. Bind it in the module's providers array.");
		logger.blank();

		return 0;
	},
};

export default makeSessionCommand;
