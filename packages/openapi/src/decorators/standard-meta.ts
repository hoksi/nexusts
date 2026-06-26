/**
 * Shared dual-mode metadata helpers for OpenAPI decorators.
 *
 * In standard mode (TC39), method decorators receive `(fn, context)`.
 * `fn.constructor` is `Function`, not the class. We stash metadata
 * directly on the function using a Symbol key.
 *
 * In legacy mode, decorators receive `(target, propertyKey)` where
 * `target` is the prototype. We use `safeDefineMeta` on the constructor.
 */
import { safeGetMeta } from "@nexusts/core/di/safe-reflect";

/** Symbol key used to stash decorator metadata on method functions. */
const FN_META_KEY = Symbol.for("nexus:openapi:fn:meta");

/**
 * Store metadata in standard mode — stashes on the function.
 */
export function storeMethodMetaStandard(
	fn: any,
	metaKey: string,
	value: unknown,
): void {
	if (!(fn as any)[FN_META_KEY]) (fn as any)[FN_META_KEY] = {};
	(fn as any)[FN_META_KEY][metaKey] = value;
}

/**
 * Read metadata that may have been stored via standard or legacy mode.
 */
export function readMethodMeta<T>(
	metaKey: string,
	ctor: any,
	propKey: string | symbol,
): T | undefined {
	// Legacy: check safeGetMeta on constructor (if ctor is a valid target).
	if (ctor && typeof ctor === "function") {
		try {
			const fromLegacy = safeGetMeta(metaKey, ctor, propKey) as T | undefined;
			if (fromLegacy !== undefined) return fromLegacy;
		} catch {
			// Ignore — target may not support metadata storage.
		}
	}
	// Standard: check the prototype function for stashed data
	if (ctor?.prototype) {
		const fn = ctor.prototype[propKey];
		if (typeof fn === "function") {
			const stashed = (fn as any)[FN_META_KEY]?.[metaKey];
			if (stashed !== undefined) return stashed as T;
		}
	}
	return undefined;
}
