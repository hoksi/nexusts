/**
 * `@ApiResponse(200, { description: 'OK', schema: UserSchema })`
 *
 * Decorate a controller method to describe one of its responses.
 * Multiple `@ApiResponse` calls accumulate.
 *
 * Dual-mode: supports TC39 standard ES decorators + legacy.
 */
import { OPENAPI_META, type ApiResponseOptions } from "../types.js";
import { safeGetMeta, safeDefineMeta } from "@nexusts/core/di/safe-reflect";
import { storeMethodMetaStandard } from "./standard-meta.js";

export function ApiResponse(
	status: number | string,
	options: ApiResponseOptions,
): any {
	const entry: [string, ApiResponseOptions] = [String(status), options];
	return function (this: any, targetOrFn: any, contextOrKey?: any): void {
		if (contextOrKey?.kind === "method") {
			const { name, metadata } = contextOrKey;
			const existing: Array<[string, ApiResponseOptions]> =
				(metadata[OPENAPI_META.RESPONSES] as Array<[string, ApiResponseOptions]>) ?? [];
			existing.push(entry);
			metadata[OPENAPI_META.RESPONSES] = existing;
			storeMethodMetaStandard(targetOrFn, OPENAPI_META.RESPONSES, existing);
			return;
		}
		const target = targetOrFn;
		const propertyKey = contextOrKey as string | symbol;
		const existing: Array<[string, ApiResponseOptions]> =
			safeGetMeta(OPENAPI_META.RESPONSES, target.constructor, propertyKey) ?? [];
		existing.push(entry);
		safeDefineMeta(OPENAPI_META.RESPONSES, existing, target.constructor, propertyKey);
	};
}
