/**
 * Metadata keys used by reflect-metadata for storing decorator data.
 *
 * These constants are the contract between decorators and the framework
 * core (DI container, router, validator).
 */
export const METADATA_KEY = {
	/** Marks a class as a Nest-style controller, stores route prefix. */
	CONTROLLER: "nexus:controller",

	/** Marks a class as an injectable provider. */
	INJECTABLE: "nexus:injectable",

	/** Marks a class as a repository. */
	REPOSITORY: "nexus:repository",

	/** Marks a class as a module. Stores module options. */
	MODULE: "nexus:module",

	/** HTTP method routes registered on a controller (Get/Post/...). */
	ROUTES: "nexus:routes",

	/** Method parameter type metadata (body/query/param/headers/ctx). */
	PARAMS: "nexus:params",

	/** Validation schema per method (Zod schema or class). */
	VALIDATE: "nexus:validate",

	/** Class-level design:paramtypes (built-in). */
	PARAMTYPES: "design:paramtypes",

	/** Class-level design:type (built-in). */
	TYPE: "design:type",

	/** Class-level design:returntype (built-in). */
	RETURNTYPE: "design:returntype",

	/** Provider token to inject for a parameter (for custom tokens). */
	INJECT: "nexus:inject",

	// ---- Exception Filters ----
	/** Route-level exception filters (@UseFilters on method). */
	FILTERS: "nexus:filters",

	/** Controller-level exception filters (@UseFilters on class). */
	CTRL_FILTERS: "nexus:ctrl:filters",

	// ---- Interceptors ----
	/** Route-level interceptors (@UseInterceptors on method). */
	INTERCEPTORS: "nexus:interceptors",

	/** Controller-level interceptors (@UseInterceptors on class). */
	CTRL_INTERCEPTORS: "nexus:ctrl:interceptors",

	// ---- Guards ----
	/** Route-level guards (@UseGuards on method). */
	GUARDS: "nexus:guards",

	/** Controller-level guards (@UseGuards on class). */
	CTRL_GUARDS: "nexus:ctrl:guards",

	// ---- Global Module ----
	/** Marks a module as global (@Global()). */
	GLOBAL: "nexus:global",

	// ---- Lifecycle ----
	/** Lifecycle hook metadata key prefix. */
	LIFECYCLE: "nexus:lifecycle",
} as const;

export type MetadataKey = (typeof METADATA_KEY)[keyof typeof METADATA_KEY];

/** Available parameter decorator locations. */
export const PARAM_TYPES = {
	REQUEST: 0,
	RESPONSE: 1,
	NEXT: 2,
	BODY: 3,
	QUERY: 4,
	PARAM: 5,
	HEADERS: 6,
	CTX: 7,
	USER: 8,
} as const;

export type ParamType = (typeof PARAM_TYPES)[keyof typeof PARAM_TYPES];

/** HTTP methods supported by the router. */
export const HTTP_METHODS = [
	"GET",
	"POST",
	"PUT",
	"DELETE",
	"PATCH",
	"OPTIONS",
	"HEAD",
] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

// ---- Standalone metadata keys for direct imports ----

/** Metadata key for route-level exception filters. */
export const EXCEPTION_FILTERS_METADATA = METADATA_KEY.FILTERS;

/** Metadata key for controller-level exception filters. */
export const CONTROLLER_EXCEPTION_FILTERS_METADATA = METADATA_KEY.CTRL_FILTERS;

/** Metadata key for route-level interceptors. */
export const INTERCEPTORS_METADATA = METADATA_KEY.INTERCEPTORS;

/** Metadata key for controller-level interceptors. */
export const CONTROLLER_INTERCEPTORS_METADATA = METADATA_KEY.CTRL_INTERCEPTORS;

/** Metadata key for route-level guards. */
export const HTTP_GUARDS_METADATA = METADATA_KEY.GUARDS;

/** Metadata key for controller-level guards. */
export const CONTROLLER_GUARDS_METADATA = METADATA_KEY.CTRL_GUARDS;
