/**
 * `@Counted()` — class-method decorator that increments a counter
 * on each call.
 *
 * Dual-mode: supports TC39 standard ES decorators + legacy.
 *
 * Usage:
 *   class UserController {
 *     @Counted('http_requests_total', { labels: () => ({ method: 'GET' }) })
 *     list() { ... }
 *   }
 *
 * The decorator reads the `MetricsService` from the global registry
 * (set by `MetricsModule.forRoot()`). When no service is registered
 * the decorator is a pass-through.
 */

import { getMetricsService } from "../service.js";

export interface CountedOptions {
	/** Optional label values, computed at call time. */
	labels?: () => Record<string, string>;
}

function makeCountedWrapper(original: (...args: unknown[]) => unknown, metricName: string, options: CountedOptions): (...args: unknown[]) => unknown {
	const isAsync = (original as any).constructor?.name === "AsyncFunction";
	if (isAsync) {
		return async function wrapped(this: unknown, ...args: unknown[]) {
			const svc = getMetricsService();
			if (svc) {
				const labels = options.labels?.();
				svc.getOrCreateCounter(
					metricName,
					undefined,
					labels ? Object.keys(labels) : undefined,
				).inc(labels);
			}
			return original.apply(this, args);
		};
	}
	return function wrapped(this: unknown, ...args: unknown[]) {
		const svc = getMetricsService();
		if (svc) {
			const labels = options.labels?.();
			svc.getOrCreateCounter(
				metricName,
				undefined,
				labels ? Object.keys(labels) : undefined,
			).inc(labels);
		}
		return original.apply(this, args);
	};
}

/**
 * Method decorator: increment a counter on each invocation.
 *
 * The counter is registered lazily the first time the method is
 * called, using the service from the global registry.
 */
export function Counted(metricName: string, options: CountedOptions = {}): any {
	return function (this: any, targetOrFn: any, contextOrKey?: any): any {
		// Standard (TC39) decorator mode
		if (contextOrKey?.kind === "method") {
			const fn = targetOrFn;
			if (typeof fn !== "function") {
				throw new Error(`@Counted() can only be applied to methods`);
			}
			return makeCountedWrapper(fn, metricName, options);
		}

		// Legacy (experimentalDecorators) mode
		const descriptor = contextOrKey as unknown as PropertyDescriptor;
		const original = descriptor.value as (...args: unknown[]) => unknown;
		if (typeof original !== "function") {
			throw new Error(`@Counted() can only be applied to methods, got ${typeof original}`);
		}
		descriptor.value = makeCountedWrapper(original, metricName, options);
		return descriptor;
	};
}
