/**
 * `@ApiParam({ name, description, required, schema })` — document a
 * path parameter. The decorator is optional — the spec builder
 * auto-derives path params from route patterns (`/users/:id` → `id`).
 * Use this when you want to override the schema or add a description.
 *
 * `@ApiQuery({ name, description, schema })` — document a query param.
 *
 * Both are dual-mode (TC39 standard + legacy).
 */
import { OPENAPI_META, type ApiParamOptions } from "../types.js";
import { safeGetMeta, safeDefineMeta } from "@nexusts/core/di/safe-reflect";
import { storeMethodMetaStandard } from "./standard-meta.js";

function makeParamDecorator(metaKey: string): (options: ApiParamOptions) => any {
	return (options: ApiParamOptions) => {
		return function (this: any, targetOrFn: any, contextOrKey?: any): void {
			if (contextOrKey?.kind === "method") {
				const { name, metadata } = contextOrKey;
				const existing: ApiParamOptions[] = (metadata[metaKey] as ApiParamOptions[]) ?? [];
				existing.push(options);
				metadata[metaKey] = existing;
				storeMethodMetaStandard(targetOrFn, metaKey, existing);
				return;
			}
			const target = targetOrFn;
			const propertyKey = contextOrKey as string | symbol;
			const existing: ApiParamOptions[] =
				safeGetMeta(metaKey, target.constructor, propertyKey) ?? [];
			existing.push(options);
			safeDefineMeta(metaKey, existing, target.constructor, propertyKey);
		};
	};
}

export const ApiParam = makeParamDecorator(OPENAPI_META.PARAMS);
export const ApiQuery = makeParamDecorator(OPENAPI_META.QUERIES);
