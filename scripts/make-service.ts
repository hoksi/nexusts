#!/usr/bin/env bun
/**
 * `bun make:service <Name>` — generate a service file under
 * `src/app/services/` with the @Injectable decorator.
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

const name = process.argv[2];
if (!name) {
	console.error("Usage: bun make:service <Name>");
	process.exit(1);
}

const out = resolve(`src/app/services/${name.toLowerCase()}.service.ts`);
if (existsSync(out)) {
	console.error(
		`Refusing to overwrite ${out}. Delete it first if you want to regenerate.`,
	);
	process.exit(1);
}

mkdirSync(dirname(out), { recursive: true });

const template = `import { Injectable } from '../../core/decorators/injectable.js';

@Injectable()
export class ${name}Service {
  // TODO: implement your service methods.
}
`;

writeFileSync(out, template);
console.log(`[make:service] wrote ${out}`);
