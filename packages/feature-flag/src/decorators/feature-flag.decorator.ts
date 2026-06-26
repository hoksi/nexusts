/**
 * `@FeatureFlag('flag-name')` — gate a route behind a feature flag.
 *
 * Dual-mode: supports TC39 standard ES decorators + legacy.
 */
import type { FlagContext } from "../types.js";
import { safeGetMeta, safeDefineMeta } from "@nexusts/core/di/safe-reflect";

const FLAG_META = Symbol.for("nexus:FeatureFlag");
const FN_KEY = Symbol.for("nexus:ff:fn:meta");

export interface FeatureFlagOptions {
	contextFn?: (c: any) => FlagContext;
	onDisabled?: (c: any) => Response | Promise<Response>;
}

export interface FlagSpec {
	propertyKey: string | symbol;
	flagName: string;
	contextFn?: (c: any) => FlagContext;
	onDisabled?: (c: any) => Response | Promise<Response>;
	original: (...args: any[]) => any;
}

export function FeatureFlag(flagName: string, options: FeatureFlagOptions = {}): any {
	return function (this: any, targetOrFn: any, contextOrKey?: any): void {
		if (contextOrKey?.kind === "method") {
			const fn = targetOrFn;
			const { name, metadata } = contextOrKey;
			const spec: FlagSpec = { propertyKey: name, flagName, contextFn: options.contextFn, onDisabled: options.onDisabled, original: fn };
			const existing: FlagSpec[] = (metadata[FLAG_META] as FlagSpec[]) ?? [];
			existing.push(spec);
			metadata[FLAG_META] = existing;
			// Also stash on the function for legacy reader access.
			if (!(fn as any)[FN_KEY]) (fn as any)[FN_KEY] = [];
			(fn as any)[FN_KEY].push(spec);
			return;
		}
		const target = targetOrFn;
		const propertyKey = contextOrKey as string | symbol;
		const descriptor = arguments[2];
		const specs: FlagSpec[] = safeGetMeta(FLAG_META, target.constructor) ?? [];
		specs.push({
			propertyKey,
			flagName,
			contextFn: options.contextFn,
			onDisabled: options.onDisabled,
			original: descriptor?.value,
		});
		safeDefineMeta(FLAG_META, specs, target.constructor);
	};
}

export function getFlagSpecs(target: any): FlagSpec[] {
	// Legacy path
	const fromLegacy = safeGetMeta(FLAG_META, target) as FlagSpec[] | undefined;
	if (fromLegacy) return fromLegacy;
	// Standard path: collect from prototype functions
	const result: FlagSpec[] = [];
	if (target?.prototype) {
		for (const key of Object.getOwnPropertyNames(target.prototype)) {
			const fn = target.prototype[key];
			if (typeof fn === "function") {
				const stashed = (fn as any)[FN_KEY];
				if (Array.isArray(stashed)) result.push(...stashed);
			}
		}
	}
	return result;
}
