## Prefer Pure Functions

- Keep shared logic as **pure functions** and avoid coupling core transformation layers to Node-only APIs.
- HTTP routes and webhook handlers may use the `nodejs` runtime, but the logic layer should remain testable as pure functions.

## Asynchronous Code Guidelines

- Do not introduce async side effects into pure functions; keep asynchronous behavior in route handlers and service layers.
- Handle errors for every `Promise`; do not leave unhandled rejections.
- Do not mark a function as `async` when it does not need `await`.
