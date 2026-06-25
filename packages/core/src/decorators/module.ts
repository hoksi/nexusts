/**
 * @Module decorator — dual-mode (TC39 standard + legacy).
 *
 * Marks a class as a Nest-style module: a logical grouping of
 * controllers and providers with explicit imports/exports.
 *
 * @example
 * ```ts
 * @Module({
 *   imports: [UserModule],
 *   controllers: [UserController],
 *   providers: [UserService],
 *   exports: [UserService],
 * })
 * class AppModule {}
 * ```
 */
import { safeGetMeta, safeDefineMeta, safeHasMeta, safeParamTypes } from "../di/safe-reflect.js";
import { METADATA_KEY } from "../constants.js";
import { initNexusMeta, getMeta } from "../di/standard-meta.js";
import type { ModuleOptions, Type } from "../di/tokens.js";

export function Module(options: ModuleOptions = {}): any {
	return function (this: any, target: any, context?: any): void {
		// ── Standard decorator mode (TC39) ──
		if (context?.kind === "class" && context?.metadata) {
			context.metadata[METADATA_KEY.MODULE] = options;
			if (typeof target === "function") {
				initNexusMeta(target as Function, context.metadata);
			}
			return;
		}

		// ── Legacy decorator mode ──
		safeDefineMeta(METADATA_KEY.MODULE, options, target);
	};
}

/** Read the @Module options from a class. */
export function getModuleOptions(target: Type<any>): ModuleOptions {
	return getMeta(target, METADATA_KEY.MODULE) ?? {};
}