/**
 * `@OnQueueReady()` — lifecycle hook that runs once when the
 * application has booted and the queue service is ready.
 *
 * Dual-mode: supports TC39 standard ES decorators + legacy.
 *
 * Use this to register workers without coupling to the `Application`
 * lifecycle directly.
 */
import type { QueueService } from "../queue.service.js";
import { safeGetMeta, safeDefineMeta } from "@nexusts/core/di/safe-reflect";

/** Symbol for stashing hook on the method function. */
const FN_HOOK_KEY = Symbol.for("nexus:queue:fn:hook");

/**
 * Method decorator. The decorated method is invoked once with no
 * arguments after the application has booted. Pair it with
 * `QueueService.start()` — typically called by `Application.bootstrap`.
 */
export function OnQueueReady(): any {
	return function (this: any, targetOrFn: any, contextOrKey?: any): void {
		// Standard (TC39) decorator mode
		if (contextOrKey?.kind === "method") {
			const fn = targetOrFn;
			const { name, metadata } = contextOrKey;
			// Stash on context.metadata AND on the function itself.
			const hooks: Array<string | symbol> = (metadata["nexus:queue:ready-hooks"] as Array<string | symbol>) ?? [];
			hooks.push(name);
			metadata["nexus:queue:ready-hooks"] = hooks;
			(fn as any)[FN_HOOK_KEY] = name;
			return;
		}

		// Legacy (experimentalDecorators) mode
		const target = targetOrFn;
		const propertyKey = contextOrKey as string | symbol;
		const descriptor = arguments[2];
		if (!descriptor || typeof descriptor.value !== "function") {
			throw new Error("@OnQueueReady can only decorate methods.");
		}
		const ctor = target.constructor as object;
		const hooks: Array<string | symbol> =
			(safeGetMeta("nexus:queue:ready-hooks", ctor) as Array<string | symbol> | undefined) ?? [];
		hooks.push(propertyKey);
		safeDefineMeta("nexus:queue:ready-hooks", hooks, ctor);
	};
}

/**
 * Get the queue-ready hooks declared on a class.
 */
export function getQueueReadyHooks(target: unknown): Array<string | symbol> {
	// Legacy: check safeGetMeta on constructor
	const ctor = (target as { constructor?: object }).constructor ?? (target as object);
	const fromLegacy = safeGetMeta("nexus:queue:ready-hooks", ctor) as Array<string | symbol> | undefined;
	if (fromLegacy) return fromLegacy;

	// Standard: check prototype methods for FN_HOOK_KEY
	const cls = typeof target === "function" ? target : (target as any)?.constructor;
	if (cls?.prototype) {
		const hooks: Array<string | symbol> = [];
		for (const key of Object.getOwnPropertyNames(cls.prototype)) {
			const fn = cls.prototype[key];
			if (typeof fn === "function" && (fn as any)[FN_HOOK_KEY]) {
				hooks.push((fn as any)[FN_HOOK_KEY]);
			}
		}
		return hooks;
	}
	return [];
}

/**
 * Helper — invoke all `@OnQueueReady` hooks on an instance.
 * Pair this with `QueueService.start()` for a complete bootstrap.
 */
export async function invokeQueueReadyHooks(instance: object): Promise<void> {
	const hooks = getQueueReadyHooks(instance);
	for (const key of hooks) {
		const fn = (instance as Record<string | symbol, unknown>)[key] as
			| ((...args: unknown[]) => Promise<void> | void)
			| undefined;
		if (typeof fn === "function") {
			await fn.call(instance);
		}
	}
}

// Re-export for convenience.
export type { QueueService };
