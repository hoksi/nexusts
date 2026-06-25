/**
 * HTTP method decorators — dual-mode (TC39 standard + legacy).
 *
 * `@Get`, `@Post`, `@Put`, `@Delete`, `@Patch`, `@Options`, `@Head` mark a
 * controller method as a route handler. The path argument is appended to
 * the controller's prefix.
 *
 * Standard mode (TC39):
 * ```ts
 * @Controller('/users')
 * class UserController {
 *   @Get('/')
 *   list(ctx: Context) {}
 * }
 * ```
 *
 * Legacy mode (experimentalDecorators: true) continues to work identically.
 */
import "reflect-metadata";
import { HTTP_METHODS, METADATA_KEY, type HttpMethod } from "../constants.js";
import type { RouteMetadata } from "../di/tokens.js";

function defineRoute(method: HttpMethod, path: string): any {
	return function (this: any, target: any, context?: any): void {
		const route: RouteMetadata = {
			method,
			path: normalizePath(path),
			propertyKey:
				context?.kind === "method"
					? context.name
					: (arguments[1] as string | symbol),
			handler:
				context?.kind === "method"
					? (target as any)[context.name]
					: arguments[2]?.value,
		};

		// ── Standard decorator mode (TC39) ──
		if (context?.kind === "method" && context?.metadata) {
			const routes: RouteMetadata[] =
				(context.metadata[METADATA_KEY.ROUTES] as RouteMetadata[]) ?? [];
			routes.push(route);
			context.metadata[METADATA_KEY.ROUTES] = routes;
			return;
		}

		// ── Legacy decorator mode ──
		const routes: RouteMetadata[] =
			Reflect.getMetadata(METADATA_KEY.ROUTES, target.constructor) ?? [];
		routes.push(route);
		Reflect.defineMetadata(METADATA_KEY.ROUTES, routes, target.constructor);
	};
}

function normalizePath(path: string): string {
	if (!path || path === "/") return "/";
	return path.startsWith("/") ? path : `/${path}`;
}

export const Get = (path: string = "/") => defineRoute("GET", path);
export const Post = (path: string = "/") => defineRoute("POST", path);
export const Put = (path: string = "/") => defineRoute("PUT", path);
export const Delete = (path: string = "/") => defineRoute("DELETE", path);
export const Patch = (path: string = "/") => defineRoute("PATCH", path);
export const Options = (path: string = "/") => defineRoute("OPTIONS", path);
export const Head = (path: string = "/") => defineRoute("HEAD", path);

/**
 * Read routes from a controller class.
 * Checks both __nexus_meta__ (standard) and reflect-metadata (legacy).
 */
export function getRoutes(target: any): RouteMetadata[] {
	// Standard: __nexus_meta__
	if (typeof target === "function" && (target as any).__nexus_meta__) {
		const meta = (target as any).__nexus_meta__;
		const routes = meta[METADATA_KEY.ROUTES] as RouteMetadata[] | undefined;
		if (routes) return routes;
	}
	// Legacy: reflect-metadata
	return Reflect.getMetadata(METADATA_KEY.ROUTES, target) ?? [];
}

export { HTTP_METHODS };
export type { RouteMetadata };