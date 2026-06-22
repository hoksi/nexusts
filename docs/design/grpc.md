# gRPC module — design

> 한국어 버전: [`grpc.ko.md`](./grpc.ko.md)

This document explains the architecture of `@kabyeon/nexusjs/grpc`:
why `@grpc/grpc-js` is a peer-dep, how `.proto` files are loaded,
how decorators wire service implementations to gRPC handlers, and
how the typed client factory works.

## Goals

1. **Add a gRPC endpoint with one `imports: [...]` entry.** No manual
   `new Server()`, no manual handler wiring, no separate config file.
   Just a `.proto` file, a service implementation class, and
   `GrpcModule.forRoot(...)`.
2. **Match the framework's DI model.** Service implementations are
   regular DI-managed classes. They can `@Inject` other services,
   use lifecycle hooks, and benefit from the same container as the
   rest of the app.
3. **Provide a type-safe client factory.** `grpc.client<T>("Name")`
   returns a proxy that converts callback-style gRPC calls into
   `Promise<T>` — no manual `new ServiceClient()` boilerplate.
4. **Keep it minimal.** Only unary RPCs for v1. Streaming (server,
   client, bidi) is deferred. No automatic code generation, no
   interceptor chain, no reflection API; those are easy to layer on
   later.
5. **Separate HTTP/1 from HTTP/2.** The gRPC server runs on its own
   port (it needs HTTP/2). The Hono HTTP/1 server is independent.
   Users can run both, one, or neither.

## Why `@grpc/grpc-js` (and not Bun-native HTTP/2)?

| Concern | Bun-native HTTP/2 | `@grpc/grpc-js` |
| ------- | ----------------- | ---------------- |
| Proto loading | Manual SDL parsing | `@grpc/proto-loader` |
| gRPC semantics | Must reimplement | Full implementation |
| Interceptors | Manual | Built-in |
| Health checking | Manual | Built-in (`@grpc/health`) |
| Server reflection | Manual | Built-in (`@grpc/reflection`) |
| Node.js compat | Bun only | Bun + Node.js |
| Bundle size | Zero (Bun built-in) | ~300KB added |

We chose `@grpc/grpc-js` because implementing gRPC semantics
(metadata propagation, deadline propagation, status codes, retry
logic, server compression negotiation) on top of Bun's `Bun.serve`
would duplicate years of battle-tested work. The bundle-size cost
is paid only by users who import the gRPC module.

`@grpc/grpc-js` works on Bun via its `http2` compatibility layer
(Bun 1.0+ ships Node-compatible `http2`). We verified this in CI.

## Why `@grpc/grpc-js` and `@grpc/proto-loader` as peer-deps?

A gRPC server runtime is ~300KB minified. Most apps that pull in
`@kabyeon/nexusjs` don't need gRPC — they need REST, an admin panel,
a CLI, etc. Bundling `@grpc/grpc-js` everywhere would penalize those
users for a feature they don't use.

By making it an optional peer-dep:

- **The framework bundle stays small.** `@kabyeon/nexusjs/grpc`
  itself is just the wiring (decorators, module, service wrapper).
  It does not include the gRPC runtime.
- **Users opt in.** `bun add @grpc/grpc-js @grpc/proto-loader` once,
  then `forRoot({...})` works.
- **Clear error on missing dep.** The first import from `nexusjs/grpc`
  does not throw (the decorators and types are pure TypeScript), but
  calling `prepare()` or `client()` before the runtime is installed
  propagates a natural `Cannot find module` error from Node's
  require resolution.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      User code                                │
│   @GrpcService("Greeter")    @GrpcMethod("SayHello")         │
│   grpc.client<GreeterClient>("Greeter")                      │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│            @kabyeon/nexusjs/grpc  (separate entry point)              │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │ GrpcService    │  │ GrpcModule     │  │ Decorators    │  │
│  │ (DI service)   │  │ (DI wiring)    │  │ @GrpcService  │  │
│  │                │  │                │  │ @GrpcMethod   │  │
│  └───────┬────────┘  └────────────────┘  └───────────────┘  │
│          │                                                    │
│          │  Owns: Server, proto definition,                   │
│          │  instance-by-service map, client constructors       │
└──────────────────────────────────────────────────────────────┘
          │
          ├─── prepare()  ──► load .proto → build handlers → register service
          ├─── start()    ──► bindAsync(host:port)
          │                   │
          ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│                  @grpc/grpc-js                                │
│                                                              │
│   Server  ◄────  addService(service, handlers)               │
│   Client  ◄────  new ServiceClient(url, creds)              │
│                                                              │
│   Credentials: ServerCredentials / credentials               │
└──────────────────────────────────────────────────────────────┘
```

The gRPC module sits **between** user code and `@grpc/grpc-js`. It:

1. Loads `.proto` files via `@grpc/proto-loader` and merges them into
   a single package tree (`loadPackageDefinition`).
2. Reads decorator metadata (`@GrpcService`, `@GrpcMethod`) to know
   which class implements which service and which methods handle
   which RPCs.
3. Creates a `@grpc/grpc-js` `Server`, calls `addService()` for each
   registered implementation, and provides `start()` / `stop()` to
   control the server lifecycle.
4. Exposes `client<T>(name, url)` that returns a Promise-based proxy
   wrapping the callback-style gRPC client.

## Module separation

`@kabyeon/nexusjs/grpc` is a **separate entry point** in `package.json`:

```json
"exports": {
  ".":     { ... },
  "./cli": { ... },
  "./grpc": { ... }
}
```

Build script (`build.ts`) bundles `src/grpc/index.ts` as its own
artifact under `dist/grpc/`. Consumers who don't use gRPC pay no
bundle-size cost.

At runtime, the gRPC module imports `@grpc/grpc-js` and
`@grpc/proto-loader`. We don't re-export them; users who need
low-level access can import them directly.

## Decorator API and metadata flow

### `@GrpcService(name: string)` — class decorator

Marks a class as an implementation of a gRPC service. The `name`
must match a `service` declaration in the `.proto` file.

```ts
@Injectable()
@GrpcService("Greeter")
class GreeterImpl {
  @GrpcMethod("SayHello")
  async sayHello(req: HelloRequest) {
    return { message: `Hello, ${req.name}!` };
  }
}
```

The decorator stores `{ name }` on the class prototype under
`Symbol.for("nexus:grpc:service")`. The framework reads it during
`prepare()` to find which proto `service` block this class
implements.

### `@GrpcMethod(name: string)` — method decorator

Binds a class method to a gRPC RPC. The `name` must match the
RPC name in the `.proto` file (PascalCase: `SayHello`, `FindById`).

Stores `{ methodKey → protoMethodName }` on the prototype under
`Symbol.for("nexus:grpc:method")`. The framework reads this map at
registration time to build the handler object passed to
`server.addService()`.

### Metadata readers

Internal functions (`getGrpcServiceName`, `getGrpcMethodNames`) read
the stored metadata. They are exported for testing but not part of
the public API.

## Service lifecycle

```
GrpcModule.forRoot(config)
  │
  ├── Creates GrpcService instance
  ├── Registers service impl classes as DI providers
  ├── Injects config via "GRPC_CONFIG" token
  │
  └── User code:
        const grpc = container.resolve(GrpcService);
        await grpc.start();   // prepare (if needed) + bindAsync
        // ... serve ...
        await grpc.stop();    // tryShutdown (1s timeout) + forceShutdown
```

### `prepare(resolve)`

Idempotent. Reads `.proto` files, builds the handler map for each
registered service implementation, and calls `server.addService()`.
The `resolve` function is injected by the module so the service
can instantiate implementation classes from the DI container.

### `start()`

Calls `prepare()` if not already done, then `server.bindAsync()`.
Supports `port: 0` for OS-assigned ports (essential in tests).
Resolves when the port is bound.

### `stop()`

Graceful shutdown via `server.tryShutdown()`, raced against a 1
second timeout. If the timeout wins, calls `forceShutdown()`. This
prevents a hung client from keeping the process alive forever.

## Handler wrapping

User methods receive the deserialized request object and return a
`Promise<TResponse>`. The framework wraps each method in a function
matching gRPC's `(call, callback) => void` signature:

```ts
function makeUnaryHandler(fn, instance) {
  return (call, callback) => {
    const req = call.request;
    let result;
    try {
      result = fn.call(instance, req);
    } catch (syncErr) {
      callback({ code: 13, details: syncErr.message });
      return;
    }
    Promise.resolve(result).then(
      (value) => callback(null, value),
      (err) => callback({ code: err.code ?? 13, details: err.message }),
    );
  };
}
```

Key design decisions:

- `fn.call(instance, req)` — binds `this` to the service instance so
  injected dependencies are accessible.
- Synchronous throws and async rejections both map to gRPC status
  code 13 (INTERNAL). Users can attach a `code` property to their
  error objects to override the status code (e.g., for custom
  business logic errors).
- The wrapper does NOT catch errors from the callback itself — those
  are gRPC-internal and should propagate naturally.

## Client factory

`grpc.client<T>(serviceName, options)` returns a typed proxy object.

```ts
type GreeterClient = {
  sayHello(req: HelloRequest): Promise<HelloResponse>;
};

const client = grpc.client<GreeterClient>("Greeter", {
  url: "127.0.0.1:50051",
});

const res = await client.sayHello({ name: "World" });
```

How it works:

1. Walks the loaded proto package tree to find the service's
   `Client` constructor (the one generated by
   `loadPackageDefinition`).
2. Creates an instance of that client: `new ClientCtor(url, creds)`.
3. Inspects `ClientCtor.service` to discover method names (PascalCase
   proto form → camelCase client form).
4. Wraps each client method in a Promise-returning function.

The type parameter `T` is the user's responsibility — the framework
cannot infer method signatures from a runtime proto object. We
recommend defining an interface that mirrors the `.proto` service
definition:

```ts
interface UserClient {
  findById(req: { id: number }): Promise<{ name: string; email: string }>;
}
```

The client factory caches the constructor for each service name
during `prepare()`, so repeated calls to `client("Greeter")` do not
re-parse the proto or create multiple client instances.

## Configuration shape

```ts
interface GrpcConfig {
  protoPath: string | string[];
  package?: string;
  services: Array<new (...args: never[]) => unknown>;
  port?: number;           // default: 50051
  host?: string;           // default: "0.0.0.0"
  tls?: {
    cert: Buffer | string;
    key: Buffer | string;
  };
  onBound?: (host: string, port: number) => void;
}
```

- `protoPath`: One or more `.proto` file paths, resolved relative to
  `process.cwd()`. Multiple files are merged into a single package
  tree. This supports splitting a large schema across multiple
  `.proto` files.
- `package`: Optional override. When omitted, the package name from
  the `.proto` file's `package` declaration is used. Required when
  the proto uses a package and the framework needs to walk the
  nested object structure to find the service definition.
- `tls`: When provided, `ServerCredentials.createSsl(cert, key)` is
  used. Otherwise `createInsecure()` (h2c). Production deployments
  should always use TLS.
- `onBound`: Callback receiving the actual bound host/port. Useful
  with `port: 0` to discover the assigned port.

## Security

### TLS

gRPC requires TLS for production (most browsers and tools reject
insecure gRPC). The framework supports TLS via the `tls` config
option:

```ts
GrpcModule.forRoot({
  protoPath: "./proto/user.proto",
  services: [UserServiceImpl],
  tls: {
    cert: readFileSync("./certs/server.crt"),
    key: readFileSync("./certs/server.key"),
  },
});
```

Plaintext (h2c) is the default for local development. We do not
auto-generate self-signed certificates.

### Authentication

gRPC authentication (TLS client certs, JWT metadata, or custom
interceptors) is **not** handled by the framework. Users who need
auth can:

1. Add a gRPC **interceptor** — wrap the method handler before
   registration.
2. Use **TLS client certificates** — pass them via the `tls` config.
3. Use a **sidecar** — authenticate at the edge (envoy, nginx)
   before the request reaches the gRPC server.

We explicitly do not ship an auth interceptor for gRPC in v1.
It's trivial to add one and everyone's auth model is different.

## Type safety

### Client typing

The `client<T>()` method uses a generic parameter so users can
define client interfaces that match their `.proto` service:

```ts
interface CalculatorClient {
  add(req: { a: number; b: number }): Promise<{ result: number }>;
  multiply(req: { a: number; b: number }): Promise<{ result: number }>;
}

const calc = grpc.client<CalculatorClient>("Calculator", {
  url: "127.0.0.1:50051",
});
const res = await calc.add({ a: 1, b: 2 });
//    ^? { result: number }
```

The framework does not generate these interfaces from the `.proto`
file. Users are expected to either:

- Write them by hand (simple for small services).
- Use `protoc` with `protoc-gen-ts` to generate them in CI.

We chose not to bundle a full proto-to-TS compiler because it would
add significant complexity for a case that's already well-served by
existing tools (`protoc-gen-ts`, `protobuf-ts`, `buf`).

### Server-side typing

Handler methods receive the request type directly and must return a
value matching the response type. TypeScript's structural typing
ensures that `{ name: string; email: string }` satisfies the gRPC
response shape.

We do not generate server types from the `.proto` file either. The
recommended approach is to share a types package between the server
and any TypeScript clients.

## DI integration

```
ApplicationContainer
  ├── UserModule
  │     └── ...
  └── ConfiguredGrpcModule (returned by GrpcModule.forRoot(config))
        ├── GrpcService           (the main service)
        ├── GRPC_SERVICE_TOKEN    (Symbol alias)
        ├── "GRPC_CONFIG"         (useValue: config)
        └── UserServiceImpl, ...  (service impl classes)
```

`GRPC_SERVICE_TOKEN` is a Symbol so it doesn't collide with class
tokens. The `useExisting` alias binds it to the same instance as
the class token:

```ts
constructor(@Inject(GrpcService) private grpc: GrpcService) {}
constructor(@Inject(GRPC_SERVICE_TOKEN) private grpc: GrpcService) {}
```

Both work and return the same instance.

### Service impl DI

Service implementation classes (registered in `config.services`) are
also added to the DI container as providers. This means they can
use `@Inject()` in their constructor:

```ts
@Injectable()
@GrpcService("UserService")
class UserServiceImpl {
  constructor(
    @Inject("DB") private db: Database,
    @Inject("LOGGER") private log: Logger,
  ) {}

  @GrpcMethod("FindById")
  async findById(req: FindByIdRequest): Promise<FindByIdResponse> {
    this.log.info("finding user %d", req.id);
    return this.db.users.findById(req.id);
  }
}
```

The framework resolves these implementations from the container
during `prepare()`. If a service impl class was not registered as
a provider, the container throws a clear resolution error.

## Lifecycle hooks

`GrpcService` does NOT use framework lifecycle hooks (`onInit`,
`onDestroy`) because the gRPC server is started manually by the
user. This is intentional:

- The user chooses **when** to start the gRPC server (after all
  other services are initialized, after a health check, etc.).
- `start()` and `stop()` are async and return Promises, making them
  suitable for test setup/teardown without framework lifecycle
  integration.
- The `prepare()` step is idempotent, so the user can call
  `start()` multiple times safely.

If a user wants automatic lifecycle management, they can call
`grpc.start()` in a custom bootstrapper or use a framework
extension to hook into the application lifecycle.

## Known limitations (v1)

### Unary methods only

Streaming RPCs (server-streaming, client-streaming, bidirectional)
are not supported in v1. The framework only registers unary handler
wrappers. When a streaming method is registered, `@grpc/grpc-js`
returns `UNIMPLEMENTED` (status code 12) at runtime.

Planned for a future release:

- **Server streaming**: `AsyncGenerator<TResponse>` return type from
  the handler method.
- **Client streaming**: `AsyncIterable<TRequest>` as the first
  argument.
- **Bidirectional streaming**: Both sides as async iterables.

### No reflection API

gRPC Server Reflection (for `grpcurl`, `grpcui`, and other tools)
is not auto-configured. Users who need it can install
`@grpc/reflection` and add it manually:

```ts
import { ReflectionService } from "@grpc/reflection";
const reflection = new ReflectionService(PROTO_DESCRIPTOR);
reflection.addToServer(grpcServer);
```

We plan to auto-configure reflection in a future release when a
descriptor set is available.

### Proto validation

We do not validate the `.proto` file beyond what
`@grpc/proto-loader.loadSync()` does. Malformed `.proto` files
produce `@grpc/proto-loader`'s error messages, which are not always
user-friendly. A future improvement could wrap these errors with
context (file path, line number).

### Client connection pooling

Each `client()` call creates a new gRPC client instance. There is
no connection pooling or lazy reconnection. For high-throughput
scenarios, users should create the client once and reuse it.

### No interceptor chain

gRPC interceptors (middleware for logging, auth, tracing) are
supported by `@grpc/grpc-js` but not surfaced in the framework's
API. Users can apply interceptors manually by wrapping the handler
before passing it to `addService()`.

## Testing strategy

- **Unit tests** for decorators — `@GrpcService`/`@GrpcMethod`
  metadata storage and retrieval.
- **Integration tests** for `GrpcService` — proto loading, handler
  wrapping, error propagation.
- **E2E tests** for the client factory — typed client → server →
  response round-trip with `port: 0`.
- **DI integration tests** — service implementations with
  `@Inject()` dependencies resolved from the container.
- **Lifecycle tests** — `start()`/`stop()` isolation, idempotent
  `prepare()`.
- **Error tests** — missing proto file, missing `@GrpcService`,
  handler throws, connection refused.

All tests run without framework lifecycle hooks (direct
`GrpcService` manipulation). An additional DI test verifies that
`GrpcModule.forRoot()` correctly registers and resolves the service.

Test conventions:

- Use `port: 0` so the OS assigns a free port (no port conflicts).
- Use `mkdtemp` for temporary `.proto` files (no filesystem state
  leak).
- Use `afterEach` to stop the server and clean up temp directories.

## Future work

- **Streaming methods** — server, client, and bidirectional streaming
  support.
- **gRPC Server Reflection** — auto-configure via
  `@grpc/reflection`.
- **Interceptors** — expose a framework-level interceptor chain
  (logging, auth, tracing).
- **Code generation** — optional `nx grpc:generate` CLI command that
  runs `protoc` with `protoc-gen-ts` to generate TypeScript types
  from `.proto` files.
- **Health check** — expose `/grpc.health.v1.Health/Check` via
  `@grpc/health`.
- **Multi-server** — support running multiple gRPC servers on
  different ports (e.g., internal RPC + external customer-facing).
- **gRPC-web gateway** — auto-generate a Hono route that proxies
  gRPC-web requests to the gRPC server (via
  `@grpc/grpc-js` + `grpc-web`).

## See also

- [`../user-guide/grpc.md`](../user-guide/grpc.md) — user guide (TBD)
- [`@grpc/grpc-js docs`](https://github.com/grpc/grpc-node) — the
  runtime we delegate to
- [`@grpc/proto-loader docs`](
  https://github.com/grpc/grpc-node/tree/master/packages/proto-loader
) — proto file loading
- [`di-container.md`](./di-container.md) — how `useExisting` works
