/**
 * `DrizzleModule` — drop-in database module.
 */
import { Module } from "@nexusts/core";
import { DrizzleService } from "./drizzle.service.js";
import type { DrizzleConfig } from "./types.js";

@Module({
	providers: [
		DrizzleService,
		{ provide: DrizzleService.TOKEN, useExisting: DrizzleService },
	],
	exports: [DrizzleService, DrizzleService.TOKEN],
})
export class DrizzleModule {
	static forRoot(config: DrizzleConfig) {
		@Module({
			providers: [
				{
					provide: DrizzleService,
					useFactory: () => new DrizzleService(config),
				},
				{
					provide: DrizzleService.TOKEN,
					useExisting: DrizzleService,
				},
				{ provide: "DRIZZLE_CONFIG", useValue: config },
			],
			exports: [DrizzleService, DrizzleService.TOKEN],
		})
		class ConfiguredDrizzleModule {}
		Object.defineProperty(ConfiguredDrizzleModule, "name", {
			value: "ConfiguredDrizzleModule",
		});
		return ConfiguredDrizzleModule;
	}
}
