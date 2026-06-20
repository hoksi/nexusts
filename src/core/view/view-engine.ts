/**
 * View engine abstraction.
 *
 * The framework can render templates using any installed engine. Built-in
 * adapters ship for Rendu (PHP-style templates) and Edge (Adonis-style).
 *
 * The default adapter is Rendu because it works on every runtime —
 * Cloudflare Workers, Bun, Deno, and Node — without extra dependencies.
 */
import { RenduAdapter } from "./rendu.js";
import type { ViewAdapter, ViewContext } from "./types.js";

export type { ViewAdapter, ViewContext, ViewOptions } from "./types.js";

/**
 * Render a view using the default (Rendu) adapter. Users can override
 * `app.setViewAdapter()` to swap to a different engine.
 */
export async function renderView(
	template: string,
	data: Record<string, any>,
	context?: ViewContext,
): Promise<string> {
	const adapter = new RenduAdapter();
	return adapter.render(template, data, context);
}

/**
 * Try a sequence of directories to locate a template file. Returns the
 * first match. This is intentionally filesystem-based and only used on
 * serverful runtimes; edge adapters should pass inline strings instead.
 */
export async function loadTemplate(
	paths: string[],
	name: string,
): Promise<string | null> {
	for (const dir of paths) {
		const full = joinPath(dir, name);
		try {
			const file = await readFile(full);
			if (file !== null) return file;
		} catch {
			// continue
		}
	}
	return null;
}

/**
 * Path join that works on both POSIX and Windows. Node/Bun provide path,
 * but Cloudflare Workers do not, so we re-implement minimally.
 */
function joinPath(dir: string, name: string): string {
	if (!dir.endsWith("/") && !dir.endsWith("\\")) return `${dir}/${name}`;
	return `${dir}${name}`;
}

async function readFile(path: string): Promise<string | null> {
	// Node/Bun.
	if (typeof globalThis.Bun !== "undefined") {
		try {
			const file = (globalThis as any).Bun.file(path);
			if (await file.exists()) return file.text();
		} catch {
			// ignore
		}
	}
	// Node-style (also works in Bun).
	try {
		const fs = await import("node:fs/promises");
		return await fs.readFile(path, "utf8");
	} catch {
		return null;
	}
}
