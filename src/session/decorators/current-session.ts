/**
 * `@CurrentSession()` — controller parameter decorator that injects
 * the current session record (or null when unauthenticated).
 *
 * Mirrors `@CurrentUser()` from `nexus/auth`.
 *
 * Usage:
 *   @Get('/profile')
 *   me(@CurrentSession() session: SessionRecord) {
 *     return session;
 *   }
 *
 *   @Get('/admin')
 *   admin(@CurrentSession({ required: true, role: 'admin' }) s: SessionRecord) {
 *     return this.adminService.runFor(s.userId!);
 *   }
 */

import 'reflect-metadata';
import { createParamDecorator } from '../../core/decorators/params.js';
import { PARAM_TYPES } from '../../core/constants.js';
import type { SessionRecord, SessionData } from '../types.js';

export interface CurrentSessionOptions<T = SessionData> {
	/**
	 * Throw a synthetic 401 when no session is present. Default: false.
	 * When true, the framework returns 401 without invoking the handler.
	 */
	required?: boolean;
	/**
	 * Throw 403 when `assert(session)` returns false.
	 */
	assert?: (session: SessionRecord<T>) => boolean | Promise<boolean>;
	/**
	 * Patch the session's data on each access (e.g. mark "last seen at").
	 * Off by default to keep read paths side-effect-free.
	 */
	touch?: boolean;
}

/**
 * Inject the current session record (or null if unauthenticated).
 */
export function CurrentSession<T = SessionData>(
	options: CurrentSessionOptions<T> = {},
): ParameterDecorator {
	return createParamDecorator(PARAM_TYPES.USER, options as never);
}

/**
 * Convenience: throw 401 when no session is present.
 */
export class UnauthenticatedError extends Error {
	readonly status = 401;
	constructor(message = 'Authentication required.') {
		super(message);
		this.name = 'UnauthenticatedError';
	}
}

/**
 * Convenience: throw 403 when a session-level check fails.
 */
export class SessionForbiddenError extends Error {
	readonly status = 403;
	constructor(message = 'Insufficient permissions.') {
		super(message);
		this.name = 'SessionForbiddenError';
	}
}
