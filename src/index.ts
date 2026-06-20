/**
 * Nexus — Bun Native Fullstack Framework.
 *
 * The public API. Users should import from `nexus` (this file), not from
 * deep paths, unless they specifically need advanced internals.
 */
import "reflect-metadata";

export * from "./core/index.js";

// Default export is the Application class so it can be imported as
// `import Nexus from 'nexus'` in addition to named imports.
import { Application } from "./core/application.js";
export default Application;
