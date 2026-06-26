/**
 * `AuthController` — built-in controller exposing common auth endpoints.
 *
 * Mount it in any `@Module` to get a working auth API:
 *
 *   @Module({
 *     controllers: [AuthController],
 *     providers: [AuthService],
 *   })
 *   export class AuthModule {}
 *
 * Endpoints (all prefixed with `config.basePath`, default `/api/auth`):
 *   - GET  /session               → current session
 *   - POST /sign-up/email         → email/password registration
 *   - POST /sign-in/email         → email/password login
 *   - POST /sign-out              → invalidate session
 *   - GET  /sign-in/:provider     → start OAuth flow
 *   - GET  /callback/:provider    → OAuth callback
 *   - POST /jwt                   → issue JWT (JWT plugin only)
 *   - POST /passkey/register      → start passkey registration
 *   - POST /passkey/authenticate  → complete passkey auth
 *
 * Most of the actual logic is delegated to `auth.handler` from
 * better-auth. The controller exists to make the routes visible to
 * `nx route:list` and to add NexusTS-style DI.
 *
 * Uses standard decorator patterns: field injection and `ctx.req.*`
 * methods instead of legacy `@Req()`/`@Body()`/`@Res()` parameter
 * decorators.
 */

import { Controller, Get, Inject, Post } from "@nexusts/core";
import type { Context } from "hono";
import { AuthService } from "./auth.service.js";
import type { AuthSession } from "./types.js";

@Controller("/api/auth")
export class AuthController {
	@Inject(AuthService.TOKEN) declare private readonly auth: AuthService;

	/**
	 * GET /api/auth/session
	 * Returns the current session (or null if unauthenticated).
	 */
	@Get("/session")
	async session(ctx: Context) {
		const session: AuthSession = await this.auth.getSession({
			headers: ctx.req.raw.headers,
		});
		return ctx.json(session ?? { user: null, session: null });
	}

	/**
	 * POST /api/auth/sign-up/email
	 * Body: { email, password, name, callbackURL? }
	 */
	@Post("/sign-up/email")
	async signUpEmail(ctx: Context) {
		const body = await ctx.req.json<any>();
		const result = await this.auth.signUp(body);
		return ctx.json(result, 201);
	}

	/**
	 * POST /api/auth/sign-in/email
	 * Body: { email, password, callbackURL? }
	 */
	@Post("/sign-in/email")
	async signInEmail(ctx: Context) {
		const body = await ctx.req.json<any>();
		const result = await this.auth.signIn(body);
		return ctx.json(result);
	}

	/**
	 * POST /api/auth/sign-out
	 */
	@Post("/sign-out")
	async signOut(ctx: Context) {
		await this.auth.signOut({ headers: ctx.req.raw.headers });
		return ctx.json({ ok: true });
	}

	/**
	 * GET /api/auth/sign-in/:provider
	 * Returns a redirect to the social provider's auth page.
	 */
	@Get("/sign-in/:provider")
	async socialSignIn(ctx: Context) {
		const provider = ctx.req.param("provider") ?? "";
		const callbackURL = ctx.req.query("callbackURL") ?? "/";
		const result = await this.auth.getOAuthUrl({ provider, callbackURL });
		return ctx.json(result);
	}

	/**
	 * GET /api/auth/callback/:provider
	 * Social provider redirect target. The better-auth handler does the
	 * real work; this is a passthrough for `route:list` visibility.
	 */
	@Get("/callback/:provider")
	async oauthCallback(ctx: Context) {
		const result = await this.auth.handleOAuthCallback({
			headers: ctx.req.raw.headers,
			query: ctx.req.query() as Record<string, string>,
		});
		return ctx.json(result);
	}

	/**
	 * POST /api/auth/jwt
	 * Issues a JWT for the current user. Requires the JWT plugin.
	 */
	@Post("/jwt")
	async issueJwt(ctx: Context) {
		const session = await this.auth.getSession({
			headers: ctx.req.raw.headers,
		});
		if (!session) return ctx.json({ error: "Unauthorized" }, 401);
		const token = await this.auth.issueJwt({ userId: session.user.id });
		return ctx.json(token);
	}

	/**
	 * POST /api/auth/passkey/register
	 * Start passkey registration. Requires the passkey plugin.
	 */
	@Post("/passkey/register")
	async passkeyRegister(ctx: Context) {
		const result = await this.auth.registerPasskey({
			headers: ctx.req.raw.headers,
		});
		return ctx.json(result);
	}

	/**
	 * POST /api/auth/passkey/authenticate
	 * Body: passkey assertion
	 */
	@Post("/passkey/authenticate")
	async passkeyAuthenticate(ctx: Context) {
		const body = await ctx.req.json<any>();
		const result = await this.auth.authenticatePasskey({
			headers: ctx.req.raw.headers,
			body,
		});
		return ctx.json(result);
	}
}
