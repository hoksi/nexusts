/**
 * Shared naming utilities for the CLI.
 *
 * Consolidates `inferTableName` and similar name-parsing helpers
 * that were previously duplicated across multiple command files.
 */

/**
 * Infer a table name from a migration name.
 *
 * Examples:
 *   "create_users_table"   → "users"
 *   "add_email_to_users"   → "users"
 *   "drop_old_index"       → "old_indexs"  (fallback)
 *   "Posts"                → "posts"
 */
export function inferTableName(input: string): string {
	if (!input) return "table";
	const m = /^create_(\w+)_table$/.exec(input);
	if (m) return m[1] ?? "table";
	const m2 = /^(?:add|remove|drop|alter)_(\w+)_to_(\w+)$/.exec(input);
	if (m2) return m2[2] ?? "table";
	return `${input.toLowerCase().replace(/s$/, "")}s`;
}

/**
 * Format a Date as YYYYMMDD_HHmmss for migration filenames.
 */
export function formatTimestamp(d: Date): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return (
		`${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
		`_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
	);
}
