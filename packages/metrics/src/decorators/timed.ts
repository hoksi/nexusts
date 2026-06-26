/**
 * `@Timed()` — class-method decorator that records a method's
 * duration in a histogram.
 *
 * Dual-mode: supports TC39 standard ES decorators + legacy.
 *
 * Usage:
 *   class UserController {
 *     @Timed('http_request_duration_seconds', { labels: () => ({ method: 'GET' }) })
 *     list() { ... }
 *   }
 *
 * The decorator reads the `MetricsService` from the global registry.
 * When no service is registered the decorator is a pass-through.
 */

import { getMetricsService } from "../service.js";

export interface TimedOptions {
	/** Optional buckets override. */
	buckets?: number[];
	/** Optional label values, computed at call time. */
	labels?: () => Record<string, string>;
}

function makeTimedWrapper(original: (...args: unknown[]) => unknown, metricName: string, options: TimedOptions): (...args: unknown[]) => unknown {
	const isAsync = (original as any).constructor?.name === "AsyncFunction";
	if (isAsync) {
		return async function wrapped(this: unknown, ...args: unknown[]) {
			const svc = getMetricsService();
			const start = performance.now();
			try {
				return await original.apply(this, args);
			} finally {
				if (svc) {
					const elapsedMs = performance.now() - start;
					const labels = options.labels?.();
					svc.getOrCreateHistogram(
						metricName,
						undefined,
						labels ? Object.keys(labels) : undefined,
						options.buckets,
					).observe(elapsedMs / 1000, labels);
				}
			}
		};
	}
	return function wrapped(this: unknown, ...args: unknown[]) {
		const svc = getMetricsService();
		const start = performance.now();
		try {
			return original.apply(this, args);
		} finally {
			if (svc) {
				const elapsedMs = performance.now() - start;
				const labels = options.labels?.();
				svc.getOrCreateHistogram(
					metricName,
					undefined,
					labels ? Object.keys(labels) : undefined,
					options.buckets,
				).observe(elapsedMs / 1000, labels);
			}
		}
	};
}

/**
 * Method decorator: observe a method's duration (in seconds) in a
 * histogram. Async methods are timed across their full await.
 */
export function Timed(metricName: string, options: TimedOptions = {}): any {
	return function (this: any, targetOrFn: any, contextOrKey?: any): any {
		// Standard (TC39) decorator mode
		if (contextOrKey?.kind === "method") {
			const fn = targetOrFn;
			if (typeof fn !== "function") {
				throw new Error(`@Timed() can only be applied to methods`);
			}
			return makeTimedWrapper(fn, metricName, options);
		}

		// Legacy (experimentalDecorators) mode
		const descriptor = contextOrKey as unknown as PropertyDescriptor;
		const original = descriptor.value as (...args: unknown[]) => unknown;
		if (typeof original !== "function") {
			throw new Error(`@Timed() can only be applied to methods, got ${typeof original}`);
		}
		descriptor.value = makeTimedWrapper(original, metricName, options);
		return descriptor;
	};
}
