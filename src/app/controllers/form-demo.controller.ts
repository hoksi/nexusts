/**
 * Inertia v3 `<Form>` server-side demo controller.
 *
 * Demonstrates the full `<Form>` lifecycle:
 * - `inertia.form(component, props)` builder
 * - `.withErrors({...})` for validation feedback
 * - `.withErrorBag(name)` for multiple forms on one page
 * - `.withValues(input)` to re-populate inputs after a failed submit
 * - `.render()` to emit the page with errors injected
 * - `.redirect(url)` for the PRG pattern (303)
 * - `.back()` to step back in history
 *
 * The matching client-side `<Form>` would look like:
 *
 *   import { Form } from '@inertiajs/inertia-react';
 *
 *   <Form action="/form-demo/users" method="post">
 *     <input name="name" />
 *     <input name="email" />
 *     <input name="password" type="password" />
 *     <button>Create</button>
 *   </Form>
 *
 * On success → 303 redirect, client follows the URL.
 * On failure → JSON page object with `errors` and `errorBag` props;
 *              the client's `useForm` hook surfaces the errors.
 */
import { z } from 'zod';
import { Controller } from '../../core/decorators/controller.js';
import { Get, Post } from '../../core/decorators/http-methods.js';
import { Inject } from '../../core/decorators/injectable.js';
import { Body } from '../../core/decorators/params.js';
import { Inertia } from '../../core/view/inertia/index.js';

const UserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

@Controller('/form-demo/users')
export class FormDemoController {
  constructor(@Inject(Inertia.TOKEN) private inertia: Inertia) {}

  /** GET — show the empty form. */
  @Get('/')
  create() {
    return this.inertia.render('Users/Create', {});
  }

  /** POST — validate and either re-render with errors or redirect. */
  @Post('/')
  async store(@Body() input: Record<string, any>) {
    const form = this.inertia.form('Users/Create');
    const result = UserSchema.safeParse(input);

    if (!result.success) {
      // Flatten Zod errors into a `{ field: [msg, ...] }` map.
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        (errors[path] ??= []).push(issue.message);
      }
      return form
        .withErrorBag('createUser')
        .withErrors(errors)
        .withValues(input) // re-populate the form for the user
        .render();
    }

    // Success — pretend to create the user, then 303 to the index.
    console.log('[form-demo] created user:', result.data.name);
    return form.redirect('/form-demo/users');
  }

  /** POST — alternative endpoint that uses `back()` instead of an explicit URL. */
  @Post('/quick')
  async quick(@Body() input: Record<string, any>) {
    const form = this.inertia.form('Users/Create');
    if (!input?.name) {
      return form.withError('name', 'Name is required').back();
    }
    return form.redirect('/form-demo/users');
  }
}