/**
 * NestJS-style controller template (standard decorator mode).
 *
 * Uses field injection (@Inject on fields) instead of constructor params,
 * and the method receives `ctx` (Hono Context) instead of @Param/@Body.
 *
 * Context keys used:
 *   name       — PascalCase class name (e.g. "User")
 *   kebab      — kebab-case URL segment (e.g. "user")
 *   pascal     — alias for name (template convenience)
 *   camel      — camelCase variable name (e.g. "userService")
 *   service    — PascalCase service name (e.g. "UserService")
 *   serviceCamel — camelCase service variable (e.g. "userService")
 */

export default `
import { Controller, Delete, Get, Inject, Post, Put, inputValue } from '@nexusts/core';
import type { Context } from 'hono';
import { {{ service }} } from '../services/{{ kebab }}.service.js';

@Controller('/{{ kebab }}s')
export class {{ name }}Controller {
  @Inject({{ service }}) declare {{ serviceCamel }}: {{ service }};

  @Get('/')
  async index(ctx: Context) {
    return this.{{ serviceCamel }}.findAll();
  }

  @Get('/:id')
  async show(ctx: Context) {
    const id = inputValue(ctx.req.param('id')).number().required().value();
    return this.{{ serviceCamel }}.findOne(id);
  }

  @Post('/')
  async create(ctx: Context) {
    const body = await ctx.req.json();
    return { status: 201, body: await this.{{ serviceCamel }}.create(body) };
  }

  @Put('/:id')
  async update(ctx: Context) {
    const id = inputValue(ctx.req.param('id')).number().required().value();
    const body = await ctx.req.json();
    return this.{{ serviceCamel }}.update(id, body);
  }

  @Delete('/:id')
  async destroy(ctx: Context) {
    const id = inputValue(ctx.req.param('id')).number().required().value();
    return this.{{ serviceCamel }}.delete(id);
  }
}
`.trimStart();