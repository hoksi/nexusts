/**
 * View engine barrel.
 *
 * Three engines ship with the framework:
 * - Rendu (PHP-style templates) — `RenduAdapter`
 * - Edge (Adonis-style mustache) — `EdgeAdapter`
 * - Inertia (React/Vue/Svelte) — `Inertia` class
 */
export * from "./types.js";
export * from "./view-engine.js";
export * from "./rendu.js";
export * from "./edge.js";
export * from "./inertia/index.js";
