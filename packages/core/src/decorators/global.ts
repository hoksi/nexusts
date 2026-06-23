/**
 * @Global() decorator.
 *
 * Marks a module as global — its exported providers are automatically
 * available in all modules without explicit import. This is useful
 * for modules that provide cross-cutting concerns like database access,
 * logging, or configuration.
 *
 * @example
 * ```ts
 * @Global()
 * @Module({
 *   providers: [DatabaseService],
 *   exports: [DatabaseService],
 * })
 * class DatabaseModule {}
 * ```
 */
import "reflect-metadata";
import { METADATA_KEY } from "../constants.js";

/**
 * Global module metadata storage.
 * Uses globalThis with a Symbol key to survive package duplication.
 */
const GLOBAL_MODULES_KEY = Symbol.for("nexus:global_modules");

function getGlobalModules(): Set<Function> {
	if (!(globalThis as any)[GLOBAL_MODULES_KEY]) {
		(globalThis as any)[GLOBAL_MODULES_KEY] = new Set<Function>();
	}
	return (globalThis as any)[GLOBAL_MODULES_KEY] as Set<Function>;
}

/**
 * @Global() decorator — marks a module as global.
 * Global modules export their providers to all modules automatically.
 */
export function Global(): ClassDecorator {
	return (target: object) => {
		getGlobalModules().add(target as Function);
		Reflect.defineMetadata(METADATA_KEY.GLOBAL, true, target);
	};
}

/** Check if a module is marked as global. */
export function isGlobalModule(target: Function): boolean {
	return getGlobalModules().has(target);
}

/** Remove a module from the global registry (used for testing). */
export function removeGlobalModule(target: Function): void {
	getGlobalModules().delete(target);
}

/** Clear all global modules (used for testing). */
export function clearGlobalModules(): void {
	getGlobalModules().clear();
}
