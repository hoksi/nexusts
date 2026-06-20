/**
 * Inertia demo controller.
 *
 * Shows the various ways to return Inertia pages from a Nest-style
 * controller:
 *
 * - Simple render with plain props
 * - Deferred props (`defer()`)
 * - Always-on props (`always()`)
 * - Optional props (`optional()`)
 * - Merge props for pagination (`merge()`)
 * - Deep merge props
 * - Once-only props
 * - Asset-version mismatches (`setVersion` on the Inertia instance)
 * - Shared data (`inertia.share(...)`)
 * - Full-page navigation (`inertia.location(...)`)
 * - History back (`inertia.back()`)
 *
 * Run with `bun src/app/main.inertia.ts`.
 */
import { Controller } from '../../core/decorators/controller.js';
import { Get, Post } from '../../core/decorators/http-methods.js';
import { Inject } from '../../core/decorators/injectable.js';
import { Inertia, defer, always, optional, merge, deepMerge, once } from '../../core/view/inertia/index.js';

interface User {
  id: number;
  name: string;
}

@Controller('/inertia')
export class InertiaDemoController {
  constructor(@Inject(Inertia.TOKEN) private inertia: Inertia) {}

  /** GET /inertia — simple page with no helpers. */
  @Get('/')
  home() {
    return this.inertia.render('Home', {
      message: 'Hello from Inertia!',
    });
  }

  /** GET /inertia/dashboard — deferred stats + always-on user. */
  @Get('/dashboard')
  dashboard() {
    return this.inertia.render('Dashboard', {
      // `always` props ride along with every partial reload.
      currentUser: always(() => ({ id: 1, name: 'Alice' })),

      // Plain props are still subject to partial-reload only/except.
      notifications: [
        { id: 1, text: 'You have a new message' },
      ],

      // `defer` sends a placeholder, then the client re-requests the
      // prop via a partial reload after hydration.
      stats: defer(async () => {
        // Simulate a slow query.
        await new Promise((r) => setTimeout(r, 100));
        return { visits: 1234, signups: 56 };
      }),

      // `optional` is dropped on partial reload when the list is empty.
      recentOrders: optional(() => [
        { id: 'a', total: 9.99 },
        { id: 'b', total: 19.99 },
      ]),

      // `once` is only included on the very first page load.
      featureFlags: once(() => ({ newDashboard: true, betaSearch: false })),
    });
  }

  /** GET /inertia/users — paginated merge props. */
  @Get('/users')
  users() {
    const page = Number((globalThis as any).__page ?? '1');
    (globalThis as any).__page = page + 1;

    // Merge props accumulate: the client appends new pages to the
    // existing array rather than replacing it.
    const allUsers: User[] = (globalThis as any).__users ?? [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Carol' },
    ];
    (globalThis as any).__users = allUsers;

    const pageUsers = allUsers.slice((page - 1) * 10, page * 10);

    return this.inertia.render('Users/Index', {
      users: merge(() => pageUsers, [['id']]),
      page,
      totalPages: 1,
    });
  }

  /** GET /inertia/profile — deep merge example. */
  @Get('/profile')
  profile() {
    return this.inertia.render('Profile', {
      // Client deep-merges new settings with existing ones.
      settings: deepMerge(() => ({
        theme: 'dark',
        notifications: { email: true, push: false },
      })),
    });
  }

  /** POST /inertia/logout — forces a full page navigation. */
  @Post('/logout')
  logout() {
    return this.inertia.location('/login');
  }

  /** GET /inertia/back — navigate one step back. */
  @Get('/back')
  back() {
    return this.inertia.back();
  }
}