/**
 * Rendu template engine adapter.
 *
 * Rendu is a PHP-style templating library that compiles templates into
 * render functions, which makes it fast and edge-friendly (no eval, no
 * file-system access at render time). It is the default adapter because
 * it works on every runtime the framework supports.
 *
 * See: https://github.com/h3js/rendu
 */
import { compileTemplate } from "rendu";
import type { ViewAdapter, ViewContext, ViewOptions } from "./types.js";

export class RenduAdapter implements ViewAdapter {
	readonly name = "rendu";
	private cache = new Map<string, ReturnType<typeof compileTemplate>>();

	render(
		template: string,
		data: Record<string, any>,
		context?: ViewContext,
		options?: ViewOptions,
	): Promise<string> {
		const merged = this.mergeData(data, context, options);
		return this.getCompiled(template, options)(merged);
	}

	compile(template: string, options?: ViewOptions) {
		const compiled = this.getCompiled(template, options);
		return (data: Record<string, any>) => compiled(data);
	}

	private getCompiled(template: string, options?: ViewOptions) {
		const cacheKey = options ? `${options.stream ? "s" : ""}` : "";
		let compiled = this.cache.get(cacheKey);
		if (!compiled) {
			compiled = compileTemplate(template, {
				stream: options?.stream ?? false,
			});
			this.cache.set(cacheKey, compiled);
		}
		return compiled;
	}

	/** Merge user data with view context globals. */
	private mergeData(
		data: Record<string, any>,
		context?: ViewContext,
		options?: ViewOptions,
	): Record<string, any> {
		const merged: Record<string, any> = { ...data };
		if (context) {
			if (context.request) merged.$REQUEST = context.request;
			if (context.response) merged.$RESPONSE = context.response;
			if (context.globals) Object.assign(merged, context.globals);
		}
		if (options?.layout) merged.$LAYOUT = options.layout;
		return merged;
	}
}
