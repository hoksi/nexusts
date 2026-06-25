/**
 * Controller template for `make:crud` — standard decorator mode.
 *
 * All five RESTful actions receive `ctx` (Hono Context) and use
 * `inputValue()` for typed param extraction + inline JSON body parsing.
 */

export default `
import { Controller, Delete, Get, Inject, Post, Put, inputValue } from '@nexusts/core';
import { z } from 'zod';
import type { Context } from 'hono';
import { {{ service }} } from '../services/{{ kebab }}.service.js';
{{#hasInertia}}import { Inertia } from '@nexusts/view';{{/hasInertia}}

const Create{{ name }}Schema = z.object({
  // TODO: define fields
  title: z.string().min(1),
});

@Controller('/{{ kebab }}s')
export class {{ controller }} {
  @Inject({{ service }}) declare {{ camel }}Service: {{ service }};
{{#hasInertia}}  @Inject(Inertia.TOKEN) declare inertia: Inertia;{{/hasInertia}}

  @Get('/')
  async index(ctx: Context) {
    const items = await this.{{ camel }}Service.findAll();
{{#hasInertia}}
    return this.inertia.render('{{ viewComponent }}', { items });
{{/hasInertia}}
{{^hasInertia}}
    return items;
{{/hasInertia}}
  }

  @Get('/:id')
  async show(ctx: Context) {
    const id = inputValue(ctx.req.param('id')).number().required().value();
    const item = await this.{{ camel }}Service.findOne(id);
{{#hasInertia}}
    return this.inertia.render('{{ viewShowComponent }}', { item });
{{/hasInertia}}
{{^hasInertia}}
    return item;
{{/hasInertia}}
  }

  @Post('/')
  async create(ctx: Context) {
    const body = Create{{ name }}Schema.parse(await ctx.req.json());
    return { status: 201, body: await this.{{ camel }}Service.create(body) };
  }

  @Put('/:id')
  async update(ctx: Context) {
    const id = inputValue(ctx.req.param('id')).number().required().value();
    const body = Create{{ name }}Schema.partial().parse(await ctx.req.json());
    return await this.{{ camel }}Service.update(id, body);
  }

  @Delete('/:id')
  async destroy(ctx: Context) {
    const id = inputValue(ctx.req.param('id')).number().required().value();
    return await this.{{ camel }}Service.delete(id);
  }
}
`.trimStart();