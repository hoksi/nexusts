/**
 * Public entry point for `nexusjs/resilience`.
 *
 *   import {
 *     ResilienceModule, ResilienceService,
 *     Retry, CircuitBreaker, Bulkhead, Resilient,
 *     retry, CircuitOpenError, BulkheadFullError,
 *   } from "@nexusts/resilience";
 */

export type { ResilienceAdminConfig } from "./admin.module.js";
export { ResilienceAdminModule } from "./admin.module.js";
export { Bulkhead, BulkheadFullError } from "./bulkhead.js";
export { CircuitBreaker, CircuitOpenError } from "./circuit-breaker.js";
export {
	applyResilience,
	Bulkhead as BulkheadDecorator,
	CircuitBreaker as CircuitBreakerDecorator,
	getMethodBulkhead,
	getMethodCircuit,
	getMethodResilient,
	getMethodRetry,
	getResilienceService,
	Resilient,
	Retry,
	setResilienceService,
} from "./decorators/index.js";
export { ResilienceModule } from "./resilience.module.js";
export { ResilienceService } from "./resilience.service.js";
export { computeBackoff, retry } from "./retry.js";
export * from "./types.js";
