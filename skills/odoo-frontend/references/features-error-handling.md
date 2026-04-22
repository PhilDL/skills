---
name: features-error-handling
description: The Odoo frontend error service, `error_handlers`, Owl `onError`, Promise rejection rules, and when an error should count as expected.
---

# Error Handling

Use this reference when the question is not "how do I catch in JavaScript?" but "how does Odoo route this error through the framework?"

## Three rules first

1. Throw `Error` objects, not strings or random values.
2. Treat rejected Promises as real errors, not soft control flow.
3. Do not rely on uncaught-exception pauses in Odoo code; most framework paths catch and inspect errors.

## Top-level module throws are effectively fatal

If a module throws while it is being defined, frontend boot can fail. There is no recovery strategy there. Keep module top level free of code that can legitimately throw.

## The error service is the global error entrypoint

Unhandled synchronous errors land on `window.error`. Unhandled async errors and rejected Promises land on `window.unhandledrejection`. Odoo's error service:

- wraps non-`Error` throws in a real `Error`;
- builds a composite stack trace, including `cause` chains;
- enriches stacks with source-map info in `debug=assets`;
- runs registered handlers from the `error_handlers` registry until one handles the error.

## Owl errors split into two paths

- Errors during `setup`, render, or lifecycle hooks are caught by Owl and can be intercepted with `onError(...)`.
- Errors from event handlers bypass Owl's render-path protection and go straight to the global error service if uncaught.

That distinction matters when you debug "why didn't my `onError` run?"

## If `onError` consumes the error, restore a safe UI state and re-dispatch it

The docs recommend this pattern when you stop rendering the broken subtree but still want Odoo's global reporting flow:

```js
import { Component, onError } from "@odoo/owl";

class ErrorBoundary extends Component {
  setup() {
    onError((error) => {
      this.removeBrokenChild();
      Promise.reject(error);
    });
  }
}
```

If you do not rethrow or re-dispatch, the error may never be reported.

## `error_handlers` have two separate decisions to make

- Return a truthy value: "I handled this kind of error."
- Call `preventDefault()` on the event: "This is an expected business error and should not count as unexpected."

That second choice matters in tests. Unexpected errors that are not `preventDefault()`-ed should still fail tests.

## Prefer explicit non-error control flow when possible

The docs argue strongly against using exceptions as routine flow control:

- they are slower;
- they make debugger pausing noisy;
- they complicate framework recovery paths.

If a situation is expected, model it as data or a return value when possible.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/frontend/error_handling.html
