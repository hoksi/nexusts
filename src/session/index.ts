/**
 * Public API for the NexusJS session module.
 *
 * Two backends out of the box:
 *   - cookie   — HMAC-signed, stateless, edge-friendly
 *   - memory   — in-process, for tests and single-instance dev
 *   - redis    — planned for v0.2
 *
 * Quick start:
 *
 *   // src/app/app.module.ts
 *   import { Module } from 'nexus';
 *   import { SessionModule } from 'nexus/session';
 *
 *   @Module({
 *     imports: [
 *       SessionModule.forRoot({
 *         backend: 'cookie',
 *         cookie: { secret: process.env.SESSION_SECRET! },
 *       }),
 *     ],
 *   })
 *   export class AppModule {}
 *
 *   // any controller
 *   import { SessionService, CurrentSession } from 'nexus/session';
 *
 *   class CartController {
 *     @Post('/')
 *     add(@CurrentSession() session, @Inject(SessionService.TOKEN) svc: SessionService) {
 *       return svc.update(session.id, { dataPatch: { cart: [...] } });
 *     }
 *   }
 */

export * from './types.js';
export {
	MemorySessionStorage,
	CookieSessionStorage,
	encodeSessionCookie,
	decodeSessionCookie,
	type MemoryStorageOptions,
} from './backends/index.js';
export { SessionService } from './session.service.js';
export { SessionModule } from './session.module.js';
export {
	CurrentSession,
	UnauthenticatedError,
	SessionForbiddenError,
	type CurrentSessionOptions,
} from './decorators/current-session.js';