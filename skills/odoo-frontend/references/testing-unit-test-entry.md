---
name: testing-unit-test-entry
description: The entry-level wiring for Odoo JavaScript unit tests: file placement, naming, asset bundling, and `/web/tests`.
---

# Unit Test Entry

Use this file to get test files picked up correctly. For the actual testing APIs, switch to [odoo-19-javascript-testing](../../odoo-19-javascript-testing/SKILL.md).

## The four setup rules

1. Put JavaScript tests under `static/tests/` in the addon.
2. Name real test files `*.test.js`.
3. Add that folder to `web.assets_unit_tests`.
4. Run them from `/web/tests`.

Minimal manifest wiring:

```python
'web.assets_unit_tests': [
    'my_addon/static/tests/**/*',
]
```

## `*.hoot.js` files are special

They are global modules for the whole test run, not regular per-suite test modules. Use them only when you intentionally need run-wide test infrastructure.

## Smallest useful test file

```js
import { expect, test } from "@odoo/hoot";

test("smoke", () => {
  expect(true).toBe(true);
});
```

## Where to go next

- Hoot primitives: [odoo-19-javascript-testing](../../odoo-19-javascript-testing/SKILL.md)
- Web test helpers and mock server: [odoo-19-javascript-testing](../../odoo-19-javascript-testing/SKILL.md)

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/frontend/unit_testing.html
