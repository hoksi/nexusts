/**
 * Sample UserController using Nest-style decorators.
 *
 * Demonstrates:
 * - `@Controller('/users')` for a route prefix
 * - `@Get/@Post/@Put/@Delete` for HTTP methods
 * - `@Body()`, `@Param()`, `@Query()` for request data
 * - `@Validate({ body: ... })` for Zod validation
 * - Constructor injection of `UserService`
 */
import { z } from 'zod';
import { Controller } from '../../core/decorators/controller.js';
import { Delete, Get, Post, Put } from '../../core/decorators/http-methods.js';
import { Inject } from '../../core/decorators/injectable.js';
import { Body, Param, Query } from '../../core/decorators/params.js';
import { Validate } from '../../core/decorators/validate.js';
import { UserService } from '../services/user.service.js';

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const ListQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

@Controller('/users')
export class UserController {
  constructor(@Inject(UserService) private readonly users: UserService) {}

  /** GET /users — list all users (with optional filtering). */
  @Get('/')
  @Validate({ query: ListQuerySchema })
  async index(@Query() query: z.infer<typeof ListQuerySchema>) {
    const all = this.users.findAll();
    if (query.q) {
      const q = query.q.toLowerCase();
      return all.filter((u) => u.name.toLowerCase().includes(q));
    }
    if (query.limit) return all.slice(0, query.limit);
    return all;
  }

  /** GET /users/:id — show one user. */
  @Get('/:id')
  async show(@Param('id') id: string) {
    const user = this.users.findById(Number(id));
    if (!user) return { status: 404, body: { error: 'User not found' } };
    return user;
  }

  /** POST /users — create a new user (validated via Zod). */
  @Post('/')
  @Validate({ body: CreateUserSchema })
  async create(@Body() body: z.infer<typeof CreateUserSchema>) {
    return { status: 201, body: this.users.create(body) };
  }

  /** PUT /users/:id — update an existing user. */
  @Put('/:id')
  @Validate({ body: UpdateUserSchema })
  async update(
    @Param('id') id: string,
    @Body() body: z.infer<typeof UpdateUserSchema>
  ) {
    const updated = this.users.update(Number(id), body);
    if (!updated) return { status: 404, body: { error: 'User not found' } };
    return updated;
  }

  /** DELETE /users/:id — remove a user. */
  @Delete('/:id')
  async destroy(@Param('id') id: string) {
    const ok = this.users.delete(Number(id));
    if (!ok) return { status: 404, body: { error: 'User not found' } };
    return { status: 204, body: null };
  }
}