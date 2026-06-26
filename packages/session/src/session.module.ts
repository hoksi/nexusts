/**
 * `SessionModule` — drop-in module for adding sessions to a NexusTS app.
 */
import { Module, Inject } from "@nexusts/core";
import { SessionService } from "./session.service.js";
import type { SessionConfig } from "./types.js";

@Module({
	providers: [
		SessionService,
		{ provide: SessionService.TOKEN, useExisting: SessionService },
	],
	exports: [SessionService, SessionService.TOKEN],
})
export class SessionModule {
	static forRoot(config: SessionConfig = {}) {
		@Module({
			providers: [
				{
					provide: SessionService,
					useFactory: () => new SessionService(config),
				},
				{ provide: SessionService.TOKEN, useExisting: SessionService },
				{ provide: "SESSION_CONFIG", useValue: config },
			],
			exports: [SessionService, SessionService.TOKEN],
		})
		class ConfiguredSessionModule {
			@Inject(SessionService.TOKEN) declare readonly sessions: SessionService;
		}

		Object.defineProperty(ConfiguredSessionModule, "name", {
			value: "ConfiguredSessionModule",
		});

		return ConfiguredSessionModule;
	}
}
