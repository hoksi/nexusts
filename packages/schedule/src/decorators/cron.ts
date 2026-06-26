/**
 * `@Cron(expression)` — schedule a method as a cron task.
 * `@Interval(milliseconds)` — repeat every N ms.
 * `@Timeout(milliseconds)` — run once after N ms.
 *
 * All dual-mode (TC39 standard + legacy).
 */
import type { ScheduleService } from "../schedule.service.js";
import type { CronExpression, CronOptions, ScheduleHandler } from "../types.js";
import { safeGetMeta, safeDefineMeta } from "@nexusts/core/di/safe-reflect";

const CRON_META = "nexus:schedule:cron";
const INTERVAL_META = "nexus:schedule:interval";
const TIMEOUT_META = "nexus:schedule:timeout";
const FN_KEY = Symbol.for("nexus:schedule:fn:meta");

function stashOnFn(fn: any, metaKey: string, value: any): void {
	if (!(fn as any)[FN_KEY]) (fn as any)[FN_KEY] = {};
	const arr = value as any[];
	const lastEntry = arr[arr.length - 1];
	if (!(fn as any)[FN_KEY][metaKey]) (fn as any)[FN_KEY][metaKey] = [];
	(fn as any)[FN_KEY][metaKey].push(lastEntry);
}

function readStashed<T>(cls: any, metaKey: string): T[] {
	const result: T[] = [];
	if (cls?.prototype) {
		for (const key of Object.getOwnPropertyNames(cls.prototype)) {
			const fn = cls.prototype[key];
			if (typeof fn === "function") {
				const stashed = (fn as any)[FN_KEY]?.[metaKey];
				if (Array.isArray(stashed)) result.push(...stashed);
			}
		}
	}
	return result;
}

function makeScheduleDecorator(metaKey: string, extract: (...args: any[]) => any): (...args: any[]) => any {
	return (...args: any[]) => {
		const value = extract(...args);
		return function (this: any, targetOrFn: any, contextOrKey?: any): void {
			if (contextOrKey?.kind === "method") {
				const { name, metadata } = contextOrKey;
				const hooks: any[] = (metadata[metaKey] as any[]) ?? [];
				hooks.push(typeof value === "function" ? value(name) : { ...value, method: name });
				metadata[metaKey] = hooks;
				stashOnFn(targetOrFn, metaKey, hooks);
				return;
			}
			const target = targetOrFn;
			const propertyKey = contextOrKey as string | symbol;
			const descriptor = arguments[2];
			if (!descriptor || typeof descriptor.value !== "function") {
				throw new Error("@Cron/@Interval/@Timeout can only decorate methods.");
			}
			const ctor = target.constructor as object;
			const existing: any[] = safeGetMeta(metaKey, ctor) ?? [];
			existing.push(typeof value === "function" ? value(String(propertyKey)) : { ...value, method: String(propertyKey) });
			safeDefineMeta(metaKey, existing, ctor);
		};
	};
}

export const Cron = makeScheduleDecorator(CRON_META, (expression: CronExpression, options: CronOptions = {}) =>
	(method: string) => ({ method, expression, options })
);

export const Interval = makeScheduleDecorator(INTERVAL_META, (milliseconds: number, name?: string) =>
	(method: string) => ({ method, milliseconds, name })
);

export const Timeout = makeScheduleDecorator(TIMEOUT_META, (milliseconds: number, name?: string) =>
	(method: string) => ({ method, milliseconds, name })
);

function readMeta<T>(metaKey: string, target: unknown): T[] {
	const ctor = (target as { constructor?: object }).constructor ?? (target as object);
	const fromLegacy = safeGetMeta(metaKey, ctor) as T[] | undefined;
	if (fromLegacy) return fromLegacy;
	return readStashed<T>(typeof target === "function" ? target : (target as any)?.constructor, metaKey);
}

export function getCronHooks(target: unknown): Array<{ method: string; expression: CronExpression; options: CronOptions }> {
	return readMeta(CRON_META, target);
}

export function getIntervalHooks(target: unknown): Array<{ method: string; milliseconds: number; name?: string }> {
	return readMeta(INTERVAL_META, target);
}

export function getTimeoutHooks(target: unknown): Array<{ method: string; milliseconds: number; name?: string }> {
	return readMeta(TIMEOUT_META, target);
}

export async function scanForSchedulers(instance: object, service: ScheduleService): Promise<string[]> {
	const ids: string[] = [];
	for (const h of getCronHooks(instance)) {
		const fn = (instance as Record<string, unknown>)[h.method] as ScheduleHandler | undefined;
		if (typeof fn !== "function") continue;
		const id = service.addCron(h.expression, fn.bind(instance), {
			...h.options,
			name: h.options.name ?? `${instance.constructor.name}.${h.method}`,
		});
		ids.push(id);
	}
	for (const h of getIntervalHooks(instance)) {
		const fn = (instance as Record<string, unknown>)[h.method] as ScheduleHandler | undefined;
		if (typeof fn !== "function") continue;
		const id = service.addInterval(h.milliseconds, fn.bind(instance), h.name ?? `${instance.constructor.name}.${h.method}`);
		ids.push(id);
	}
	for (const h of getTimeoutHooks(instance)) {
		const fn = (instance as Record<string, unknown>)[h.method] as ScheduleHandler | undefined;
		if (typeof fn !== "function") continue;
		const id = service.addTimeout(h.milliseconds, fn.bind(instance), h.name ?? `${instance.constructor.name}.${h.method}`);
		ids.push(id);
	}
	return ids;
}

export type { ScheduleService };
