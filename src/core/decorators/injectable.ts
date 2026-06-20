/**
 * @Injectable decorator.
 *
 * Marks a class as available for DI. The container uses reflect-metadata's
 * `design:paramtypes` to read constructor parameter types and resolve them
 * automatically.
 *
 * @example
 * ```ts
 * @Injectable()
 * class UserService {
 *   constructor(private repo: UserRepository) {}
 * }
 * ```
 */
import "reflect-metadata";
import { METADATA_KEY } from "../constants.js";

export function Injectable(): ClassDecorator {
	return (target: object) => {
		Reflect.defineMetadata(METADATA_KEY.INJECTABLE, true, target);
	};
}

export function isInjectable(target: any): boolean {
	return Reflect.hasMetadata(METADATA_KEY.INJECTABLE, target);
}

/**
 * Mark a parameter as resolved by a specific token instead of its declared
 * type. Useful for interfaces, abstract classes, or string tokens.
 *
 * @example
 * ```ts
 * constructor(@Inject('CONFIG') private config: AppConfig) {}
 * ```
 */
export function Inject<T = any>(token: any): ParameterDecorator {
	return (
		target: object,
		propertyKey: string | symbol | undefined,
		parameterIndex: number,
	) => {
		const existing: Map<number, any> =
			Reflect.getMetadata(METADATA_KEY.INJECT, target) ?? new Map();
		existing.set(parameterIndex, token);
		Reflect.defineMetadata(METADATA_KEY.INJECT, existing, target);
	};
}
