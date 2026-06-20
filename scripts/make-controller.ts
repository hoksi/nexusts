#!/usr/bin/env bun
/**
 * `bun make:controller <Name>` — generate a controller file under
 * `src/app/controllers/` with the basic decorator structure.
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

const name = process.argv[2];
if (!name) {
	console.error("Usage: bun make:controller <Name>");
	process.exit(1);
}

const out = resolve(`src/app/controllers/${name.toLowerCase()}.controller.ts`);
if (existsSync(out)) {
	console.error(
		`Refusing to overwrite ${out}. Delete it first if you want to regenerate.`,
	);
	process.exit(1);
}

mkdirSync(dirname(out), { recursive: true });

const template = `import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query, Validate } from '../../core/decorators/index.js';

@Controller('/${name.toLowerCase()}s')
export class ${name}Controller {
  @Get('/')
  async index() {
    return [];
  }

  @Get('/:id')
  async show(@Param('id') id: string) {
    return { id };
  }

  @Post('/')
  @Validate({ body: undefined })
  async create(@Body() body: any) {
    return { created: body };
  }

  @Put('/:id')
  async update(@Param('id') id: string, @Body() body: any) {
    return { id, body };
  }

  @Delete('/:id')
  async destroy(@Param('id') id: string) {
    return { removed: id };
  }
}
`;

writeFileSync(out, template);
console.log(`[make:controller] wrote ${out}`);
