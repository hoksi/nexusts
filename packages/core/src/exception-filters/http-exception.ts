/**
 * HttpException — a typed HTTP exception with status code and message.
 *
 * Throw from a controller or service method and it will be caught by the
 * framework's exception filter pipeline. The default filter serializes it
 * as a JSON error response with the given status code.
 *
 * @example
 * ```ts
 * @Get('/users/:id')
 * findOne(@Param('id') id: string) {
 *   const user = this.users.findById(id);
 *   if (!user) throw new HttpException(404, `User ${id} not found`);
 *   return user;
 * }
 * ```
 */
export class HttpException extends Error {
	readonly statusCode: number;

	constructor(statusCode: number, message?: string, options?: ErrorOptions) {
		super(message ?? `HTTP ${statusCode}`, options);
		this.name = "HttpException";
		this.statusCode = statusCode;
	}

	/**
	 * Factory: 400 Bad Request.
	 * @example throw HttpException.badRequest("Invalid email");
	 */
	static badRequest(message?: string): HttpException {
		return new HttpException(400, message ?? "Bad Request");
	}

	/**
	 * Factory: 401 Unauthorized.
	 * @example throw HttpException.unauthorized();
	 */
	static unauthorized(message?: string): HttpException {
		return new HttpException(401, message ?? "Unauthorized");
	}

	/**
	 * Factory: 403 Forbidden.
	 * @example throw HttpException.forbidden();
	 */
	static forbidden(message?: string): HttpException {
		return new HttpException(403, message ?? "Forbidden");
	}

	/**
	 * Factory: 404 Not Found.
	 * @example throw HttpException.notFound(`User ${id} not found`);
	 */
	static notFound(message?: string): HttpException {
		return new HttpException(404, message ?? "Not Found");
	}

	/**
	 * Factory: 409 Conflict.
	 * @example throw HttpException.conflict("Email already taken");
	 */
	static conflict(message?: string): HttpException {
		return new HttpException(409, message ?? "Conflict");
	}

	/**
	 * Factory: 422 Unprocessable Entity.
	 * @example throw HttpException.unprocessable("Validation failed");
	 */
	static unprocessable(message?: string): HttpException {
		return new HttpException(422, message ?? "Unprocessable Entity");
	}

	/**
	 * Factory: 429 Too Many Requests.
	 * @example throw HttpException.tooManyRequests();
	 */
	static tooManyRequests(message?: string): HttpException {
		return new HttpException(429, message ?? "Too Many Requests");
	}

	/**
	 * Factory: 500 Internal Server Error.
	 * @example throw HttpException.internalServerError();
	 */
	static internalServerError(message?: string): HttpException {
		return new HttpException(500, message ?? "Internal Server Error");
	}

	/**
	 * Factory: 503 Service Unavailable.
	 * @example throw HttpException.serviceUnavailable();
	 */
	static serviceUnavailable(message?: string): HttpException {
		return new HttpException(503, message ?? "Service Unavailable");
	}

	toJSON(): Record<string, unknown> {
		return {
			error: this.message,
			statusCode: this.statusCode,
		};
	}
}
