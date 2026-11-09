## Cross-context integration

A bounded context must not inject another bounded context's Store directly.

When a context needs data or a capability owned by another context:

1. Define a narrow application port in the consuming context.
2. Implement the port with an application facade in the owning context.
3. Bind the port to the facade in the owning context's provider configuration.
4. Expose only the minimum data and operations required by the consumer.
5. Use stable identifiers and purpose-specific DTOs; do not leak full domain entities.
6. Do not create circular dependencies between contexts.
7. Do not use cross-context stores to mutate another context's internal state.

Example:

- `monitoring` defines `AssetSummaryPort`.
- `assets` implements it with `AssetSummaryFacade`.
- `monitoring` injects `AssetSummaryPort`, never `AssetsStore`.

Exception:

- IAM may expose a narrow `SessionAccessPort` for authentication/role checks.
- Do not expose tokens, storage internals, refresh behavior, or IAM infrastructure through this port.
