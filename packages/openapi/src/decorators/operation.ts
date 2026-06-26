/**
 * `@ApiOperation({ summary, description, operationId, tags, deprecated })`
 *
 * Decorate a controller method to describe the operation in the spec.
 *
 * Dual-mode: supports TC39 standard ES decorators + legacy.
 */
import { OPENAPI_META, type ApiOperationOptions } from "../types.js";
import { safeDefineMeta } from "@nexusts/core/di/safe-reflect";
import { storeMethodMetaStandard } from "./standard-meta.js";

export function ApiOperation(options: ApiOperationOptions): any {
	return function (this: any, targetOrFn: any, contextOrKey?: any): void {
		if (contextOrKey?.kind === "method") {
			const { name, metadata } = contextOrKey;
			metadata[OPENAPI_META.OPERATION] = options;
			storeMethodMetaStandard(targetOrFn, OPENAPI_META.OPERATION, options);
			return;
		}
		const target = targetOrFn;
		const propertyKey = contextOrKey as string | symbol;
		safeDefineMeta(OPENAPI_META.OPERATION, options, target.constructor, propertyKey);
	};
}
