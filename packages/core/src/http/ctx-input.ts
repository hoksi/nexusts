/**
 * CtxInput — Input helper for the standard-decorator era.
 *
 * Provides typed helpers on the Hono Context so controller methods
 * can do:
 *
 * ```ts
 * const id   = ctx.param("id").number().required().value();
 * const name = ctx.query("name").trim().max(100).value();
 * const body = ctx.body(CreateUserSchema);
 * ```
 *
 * Uses Hono's `c.set` / `c.get` mechanism so no global state is needed.
 */
import type { Context as HonoContext } from "hono";
import type { InputValueChain } from "./input-value.js";
import { inputValue } from "./input-value.js";

export const INPUT_HELPER_KEY = "nexus:input";

/** Return type for schema-parsed body. */
export type CtxInput = {
	/** Get a route param with input chaining. */
	param(name: string): InputValueChain<string>;
	/** Get a query string param with input chaining. */
	query(name: string): InputValueChain<string | undefined>;
	/** Get ALL query params as a plain object. */
	allQueries(): Record<string, string | string[]>;
	/** Get a header value. */
	header(name: string): InputValueChain<string | undefined>;
	/** Get ALL route params as a plain object. */
	allParams(): Record<string, string>;
	/**
	 * Parse the request body as JSON and optionally validate against a schema.
	 * If a schema (with a `.parse` method) is given, returns the parsed value.
	 * Otherwise returns the raw parsed body.
	 */
	body: BodyHelper;
};

type BodyHelper = {
	<T = any>(): Promise<T>;
	<T>(schema: { parse(data: unknown): T }): Promise<T>;
};

/**
 * Create the input helper and attach it to the Hono context.
 * Called once per request in the router.
 */
export function attachInputHelper(c: HonoContext): CtxInput {
	const existing = c.get(INPUT_HELPER_KEY) as CtxInput | undefined;
	if (existing) return existing;

	const helper: CtxInput = {
		param(name: string): InputValueChain<string> {
			return inputValue(c.req.param(name) ?? "");
		},

		query(name: string): InputValueChain<string | undefined> {
			return inputValue<string | undefined>(c.req.query(name));
		},

		allQueries(): Record<string, string | string[]> {
			return c.req.queries() ?? {};
		},

		header(name: string): InputValueChain<string | undefined> {
			return inputValue<string | undefined>(c.req.header(name));
		},

		allParams(): Record<string, string> {
			return c.req.param();
		},

		get body(): BodyHelper {
			const bodyFn = async <T = any>(schema?: {
				parse(data: unknown): T;
			}): Promise<T> => {
				let parsed: any;
				try {
					parsed = await c.req.json();
				} catch {
					// Try form-encoded or multipart
					try {
						parsed = await c.req.parseBody();
					} catch {
						parsed = {};
					}
				}
				if (schema) {
					return schema.parse(parsed) as T;
				}
				return parsed as T;
			};
			return bodyFn as BodyHelper;
		},
	};

	c.set(INPUT_HELPER_KEY, helper);
	return helper;
}

/**
 * Retrieve the input helper from a Hono context.
 * Throws if not attached (should not happen in normal flow).
 */
export function getInputHelper(c: HonoContext): CtxInput {
	const helper = c.get(INPUT_HELPER_KEY) as CtxInput | undefined;
	if (!helper) {
		// Auto-attach as fallback
		return attachInputHelper(c);
	}
	return helper;
}
