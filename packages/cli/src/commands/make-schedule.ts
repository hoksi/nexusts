/**
 * `nx make:schedule <Name>` — scaffold a scheduled task class.
 *
 * Generates:
 *   - app/schedule/tasks/<name>.task.ts
 *     — an @Injectable class with example @Cron / @Interval /
 *       @Timeout handlers
 *
 * Usage:
 *   nx make:schedule HourlyCleanup
 *   nx make:schedule DailyDigest --cron "@daily"
 *   nx make:schedule Heartbeat --interval 30000
 */

import { resolve } from "node:path";
import type { Command, CommandContext } from "../core/index.js";
import { logger, nameVariants, render, writeFile } from "../core/index.js";
import { templates } from "../templates/index.js";

export const makeScheduleCommand: Command = {
	name: "make:schedule",
	aliases: ["msk", "make-schedule"],
	summary: "Scaffold a scheduled task class",
	description:
		"Generates an @Injectable task class with example @Cron / @Interval / @Timeout handlers under app/schedule/tasks/.",
	examples: ["nx make:schedule HourlyCleanup", "nx make:schedule DailyDigest"],
	async run(ctx: CommandContext): Promise<number> {
		const name = ctx.positional[0];
		if (!name) {
			logger.error("Usage: nx make:schedule <Name>");
			return 1;
		}

		const variants = nameVariants(name);
		const code = render(templates.schedule, {
			name: variants.pascal,
			kebab: variants.kebab,
		});
		const out = resolve(
			ctx.cwd,
			`${ctx.config.paths.app}/schedule/tasks`,
			`${variants.kebab}.task.ts`,
		);

		if (writeFile(out, code, { skipIfExists: true })) {
			logger.success(`created ${out}`);
		} else {
			logger.warn(`skipped (exists): ${out}`);
		}

		logger.blank();
		logger.heading("Next steps");
		logger.info("1. Add @Cron / @Interval / @Timeout handlers to the class.");
		logger.info("2. Add the task class to your module's providers array.");
		logger.info("   → Auto-detected at boot, no main.ts changes needed.");
		logger.blank();

		return 0;
	},
};

export default makeScheduleCommand;
