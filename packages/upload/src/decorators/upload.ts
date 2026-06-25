/**
 * `@Upload('fieldName', opts?)` — declare that a controller method
 * expects one or more uploaded files in `multipart/form-data`.
 *
 *   @Post('/avatars')
 *   @Upload('avatar')
 *   async upload(ctx: Context) {
 *     const file = ctx.uploadedFile('avatar');
 *     ...
 *   }
 *
 *   @Post('/photos')
 *   @Upload('photos', { maxFiles: 10 })
 *   async multi(ctx: Context) {
 *     const files = ctx.uploadedFiles('photos');
 *     ...
 *   }
 *
 * Standard decorator mode (TC39):
 *   The decorator stores metadata via `context.metadata` and copies
 *   it to the class constructor via `__nexus_meta__`.
 *
 * Legacy decorator mode (experimentalDecorators):
 *   Uses the old `safeDefineMeta` path with `reflect-metadata` or the
 *   framework's internal Map fallback.
 */
import { UPLOAD_META, type UploadOptions } from "../types.js";
import { safeGetMeta, safeDefineMeta } from "@nexusts/core/di/safe-reflect";

/** Default name when the decorator is applied without arguments. */
const DEFAULT_NAME = "__upload__";

export function Upload(name: string = DEFAULT_NAME, options: UploadOptions = {}): any {
	return function (this: any, target: any, context?: any): void {
		// ── Standard decorator mode (TC39) ──
		if (context?.kind === "method" && context?.metadata) {
			const cls = typeof target === "function" ? target : target?.constructor;
			if (!cls) return;
			const key = typeof context.name === "symbol" ? context.name : String(context.name);
			const existing: Array<{ name: string; options: UploadOptions }> =
				context.metadata[UPLOAD_META]?.[key] ?? [];
			existing.push({ name, options });
			if (!context.metadata[UPLOAD_META]) context.metadata[UPLOAD_META] = {};
			context.metadata[UPLOAD_META][key] = existing;
			return;
		}

		// ── Legacy decorator mode ──
		const propertyKey = typeof context === "string" || typeof context === "symbol"
			? context
			: (arguments[1] as string | symbol | undefined);
		if (!propertyKey) return;
		const cls = (target as any)?.constructor ?? target;
		const existing: Array<{ name: string; options: UploadOptions }> =
			safeGetMeta(UPLOAD_META, cls, propertyKey) ?? [];
		existing.push({ name, options });
		safeDefineMeta(UPLOAD_META, existing, cls, propertyKey);
	};
}
