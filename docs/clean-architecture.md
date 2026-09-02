# Clean architecture for illustrator-mcp

The supplied Clean Architecture proposal is useful, with a few important refinements for this project.

## Dependency rule

Dependencies point toward stable policy:

```
MCP / HTTP / local bridge / Adobe APIs
               |
               v
      interface adapters
               |
               v
       application use cases
               |
               v
          domain model
```

The tracing core and domain types never import Illustrator, MCP, HTTP, ExtendScript or UXP code.

## Organize by dependency, but not dogmatically

"Layer by dependency direction, not by feature" is directionally correct, but the repository does not need one giant folder per layer forever. As features grow, feature folders inside those boundaries are fine. The invariant is imports/dependencies, not directory aesthetics.

## Application use cases are not necessarily pure

Use cases may perform I/O *through ports*. Their policy and orchestration remain testable because the concrete I/O mechanism is injected. Pure geometry should stay in the tracing domain/core.

## IllustratorPort

`src/application/ports/illustrator-port.ts` is the application-facing capability contract. Adobe MCP, ExtendScript and UXP implementations live outside application/domain code.

Prefer named capabilities over a generic `executeScript` method. An arbitrary script escape hatch, if implemented at all, belongs to a local-only adapter and must never be on the remotely tunneled tool surface.

## Transactions are compensating, not ACID

Illustrator does not give us database transactions. "rollback" therefore means one of:

1. explicit compensation created by the command,
2. a reliable adapter-level immediate undo,
3. restoration from a known snapshot for operations that cannot be compensated.

The transaction report must make partial rollback visible instead of claiming perfect atomicity.

## Security model

### Local bridge

Even localhost requires authentication. Use a cryptographically random per-session bearer token and reject requests without it.

Also enforce:

- localhost binding by default,
- strict request body limits,
- explicit allowed origins if a browser surface is ever introduced,
- no GET endpoints that mutate state,
- no secrets in model-visible tool results or logs.

### Remote MCP

Expose only named, narrow tools. Do not remotely expose:

- arbitrary script execution,
- raw file-system access,
- arbitrary shell/process execution,
- Illustrator/Adobe credentials.

Destructive operations should support dry-run / preview semantics and explicit confirmation at the client/tool policy layer.

### Arbitrary scripting

Regex validation is only defense-in-depth; it is not a secure JavaScript sandbox. The preferred architecture is to not accept arbitrary model-authored scripts at all.

## Recommended vertical slice

The first Illustrator-connected milestone should remain deliberately small:

1. inspect active document,
2. create a named layer,
3. create a text object,
4. return stable object references,
5. compensate/undo the mutation,
6. expose that use case through MCP.

Only after that works reliably on Windows should we add path construction, transforms and tracing-to-Illustrator.
