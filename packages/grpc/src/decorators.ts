/**
 * gRPC decorators.
 *
 * Dual-mode: supports TC39 standard ES decorators + legacy.
 *
 * Unary (request → response):
 *   @GrpcMethod("FindById")
 *   async findById(req: { id: number }): Promise<TRes> { ... }
 *
 * Server streaming (request → stream<response>):
 *   @GrpcServerStream("ListItems")
 *   async *listItems(req: { page: number }): AsyncIterable<TItem> { yield ...; }
 *
 * Client streaming (stream<request> → response):
 *   @GrpcClientStream("UploadChunks")
 *   async uploadChunks(req: AsyncIterable<TChunk>): Promise<TResult> { ... }
 *
 * Bidirectional streaming (stream<request> → stream<response>):
 *   @GrpcBidiStream("Chat")
 *   async *chat(req: AsyncIterable<TMsg>): AsyncIterable<TMsg> { yield ...; }
 */

import type { GrpcMethodEntry, GrpcStreamType } from "./types.js";

const GRPC_SERVICE_KEY = Symbol.for("nexus:grpc:service");
const GRPC_METHOD_KEY = Symbol.for("nexus:grpc:method");
const FN_METHOD_KEY = Symbol.for("nexus:grpc:fn:method");

/**
 * Mark a class as a gRPC service implementation. The `name`
 * must match a `service` declaration in the .proto file.
 *
 * Dual-mode: supports TC39 standard ES decorators + legacy.
 */
export function GrpcService(name: string): any {
	return function (this: any, target: any, context?: any): void {
		const cls = context?.kind === "class" ? target : target;
		const proto = cls.prototype ?? cls;
		proto[GRPC_SERVICE_KEY] = { name };
	};
}

// ── Shared factory (dual-mode) ──────────────────────────────────────────────

function makeMethodDecorator(protoName: string, streamType: GrpcStreamType): any {
	return function (this: any, targetOrFn: any, contextOrKey?: any): any {
		const entry: GrpcMethodEntry = { protoName, streamType };

		// Standard (TC39) decorator mode
		if (contextOrKey?.kind === "method") {
			const fn = targetOrFn;
			const { name } = contextOrKey;
			// Store on the function itself for prototype-based readers
			fn[FN_METHOD_KEY] = fn[FN_METHOD_KEY] ?? {};
			fn[FN_METHOD_KEY][name] = entry;
			return;
		}

		// Legacy (experimentalDecorators) mode
		const _target = targetOrFn;
		const propertyKey = contextOrKey as string | symbol;
		const proto = (_target as { prototype?: object }).prototype ?? _target;
		proto[GRPC_METHOD_KEY] = proto[GRPC_METHOD_KEY] ?? {};
		proto[GRPC_METHOD_KEY][propertyKey] = entry;
	};
}

// ── Public decorators ───────────────────────────────────────────────────────

/**
 * Bind a method to a unary gRPC handler.
 * The method receives `(request: TReq)` and returns `Promise<TRes>`.
 */
export function GrpcMethod(name: string): any {
	return makeMethodDecorator(name, "unary");
}

/**
 * Bind a method to a server-streaming gRPC handler.
 * The method receives `(request: TReq)` and returns `AsyncIterable<TRes>`.
 *
 * @example
 *   @GrpcServerStream("ListNumbers")
 *   async *listNumbers(req: { count: number }): AsyncIterable<{ n: number }> {
 *     for (let i = 0; i < req.count; i++) yield { n: i };
 *   }
 */
export function GrpcServerStream(name: string): any {
	return makeMethodDecorator(name, "server");
}

/**
 * Bind a method to a client-streaming gRPC handler.
 * The method receives `(requests: AsyncIterable<TReq>)` and returns `Promise<TRes>`.
 *
 * @example
 *   @GrpcClientStream("Sum")
 *   async sum(reqs: AsyncIterable<{ n: number }>): Promise<{ total: number }> {
 *     let total = 0;
 *     for await (const { n } of reqs) total += n;
 *     return { total };
 *   }
 */
export function GrpcClientStream(name: string): any {
	return makeMethodDecorator(name, "client");
}

/**
 * Bind a method to a bidirectional-streaming gRPC handler.
 * The method receives `(requests: AsyncIterable<TReq>)` and returns `AsyncIterable<TRes>`.
 *
 * @example
 *   @GrpcBidiStream("Echo")
 *   async *echo(reqs: AsyncIterable<{ msg: string }>): AsyncIterable<{ msg: string }> {
 *     for await (const { msg } of reqs) yield { msg: `echo: ${msg}` };
 *   }
 */
export function GrpcBidiStream(name: string): any {
	return makeMethodDecorator(name, "bidi");
}

// ── Metadata readers (internal) ─────────────────────────────────────────────

/** Read the gRPC service name. Internal. */
export function getGrpcServiceName(target: object): string | undefined {
	const t = (target as { prototype?: object }).prototype ?? target;
	return (t as any)[GRPC_SERVICE_KEY]?.name;
}

/**
 * Read the bound method names for a gRPC service.
 * Returns `{ [propertyKey]: protoMethodName }`.
 */
export function getGrpcMethodNames(target: object): Record<string, string> {
	const entries = getGrpcMethodEntries(target);
	const result: Record<string, string> = {};
	for (const [key, entry] of Object.entries(entries)) result[key] = entry.protoName;
	return result;
}

/**
 * Read all decorated method entries (with streaming type info).
 * Tries legacy storage first (GRPC_METHOD_KEY on prototype), then
 * falls back to collecting from individual function objects (standard mode).
 */
export function getGrpcMethodEntries(target: object): Record<string, GrpcMethodEntry> {
	const t = (target as { prototype?: object }).prototype ?? target;
	const legacy = (t as any)[GRPC_METHOD_KEY];
	if (legacy) return legacy;
	// Standard mode: collect from prototype function objects
	return collectFnMethods(target);
}

function collectFnMethods(target: object): Record<string, GrpcMethodEntry> {
	const result: Record<string, GrpcMethodEntry> = {};
	const proto = (target as { prototype?: object }).prototype ?? target;
	for (const key of Object.getOwnPropertyNames(proto)) {
		const fn = (proto as any)[key];
		if (typeof fn !== "function") continue;
		const stashed = (fn as any)[FN_METHOD_KEY];
		if (stashed) Object.assign(result, stashed);
	}
	return result;
}

export type { GrpcMethodEntry };
