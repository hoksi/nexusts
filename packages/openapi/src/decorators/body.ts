/**
 * `@ApiBody({ description, required, schema })` — document the request
 * body. Auto-derivation from `@Validate({ body })` runs first; explicit
 * `@ApiBody` decorators take precedence.
 *
 * Dual-mode: supports TC39 standard ES decorators + legacy.
 */
import { OPENAPI_META, type ApiBodyOptions } from "../types.js";
import { safeDefineMeta } from "@nexusts/core/di/safe-reflect";
import { storeMethodMetaStandard } from "./standard-meta.js";

export function ApiBody(options: ApiBodyOptions): any {
	return function (this: any, targetOrFn: any, contextOrKey?: any): void {
		if (contextOrKey?.kind === "method") {
			const { name, metadata } = contextOrKey;
			metadata[OPENAPI_META.BODY] = options;
			storeMethodMetaStandard(targetOrFn, OPENAPI_META.BODY, options);
			return;
		}
		const target = targetOrFn;
		const propertyKey = contextOrKey as string | symbol;
		safeDefineMeta(OPENAPI_META.BODY, options, target.constructor, propertyKey);
	};
}
