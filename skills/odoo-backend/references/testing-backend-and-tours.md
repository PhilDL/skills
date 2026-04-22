---
name: testing-backend-and-tours
description: Python backend tests, Odoo test helpers, test tags, `Form`, `HttpCase`, tours, and query-count assertions for catching regressions before they reach production.
---

# Backend Testing and Tours

Odoo backend tests are standard `unittest`-style Python tests with Odoo-specific base classes and helpers. Keep Python business logic in Python tests; use tours only when you need end-to-end browser and server interaction together.

## Test package structure

```text
my_module/
├── tests/
│   ├── __init__.py
│   ├── test_trip_flow.py
│   └── test_trip_security.py
```

`tests/__init__.py` must import each test module or Odoo will not run it.

## Default Python test classes

- `TransactionCase`: default choice for model/business logic tests
- `SingleTransactionCase`: share one transaction across tests in the class
- `HttpCase`: use when browser or HTTP flows are involved

Helpers exposed by the docs include:

- `ref(...)`
- `browse_ref(...)`
- `Form`
- `M2MProxy`
- `O2MProxy`

## Minimal `TransactionCase`

```python
from odoo.tests import TransactionCase


class TestBusinessTrip(TransactionCase):
    def test_confirm_trip(self):
        trip = self.env["business.trip"].create({"name": "Conference"})
        trip.action_confirm()
        self.assertEqual(trip.state, "confirmed")
```

## Tagging and test selection

Default tags on Odoo test classes:

- `standard`
- `at_install`

Common pattern for browser-heavy cases:

```python
from odoo.tests import HttpCase, tagged


@tagged("-at_install", "post_install")
class TestTripUi(HttpCase):
    ...
```

CLI selection:

```bash
odoo-bin --test-tags /my_module
odoo-bin --test-tags "standard,-slow"
odoo-bin --test-tags "/my_module:TestBusinessTrip.test_confirm_trip"
```

## Use `Form` for form-style model flows

When business logic depends on defaults, onchanges, or relational widget-like semantics, `Form` is usually a better test helper than calling `create()` with a giant dict.

## Tours: end-to-end integration tests

Use tours when Python and JavaScript must cooperate in a real browser-like flow.

Python side:

```python
from odoo.tests import HttpCase, tagged


@tagged("-at_install", "post_install")
class TestTripTour(HttpCase):
    def test_trip_tour(self):
        self.start_tour("/web", "my_trip_tour", login="admin")
```

Tour JS must be added to assets and registered in the tour registry.

## Debugging tours

Documented options worth using locally:

- `watch=True`
- `debug=True`
- `break: true`
- `pause: true`

These are the fastest way to stop guessing when a browser flow is flaky.

## Query-count assertions

For backend performance regressions, assert query budgets directly:

```python
with self.assertQueryCount(11):
    self.env["business.trip"]._compute_dashboard_data()
```

## Use the dedicated JS testing skill for frontend mechanics

This reference keeps only the backend and integration angle. For Hoot, web test helpers, or mock-server specifics, load the `odoo-19-javascript-testing` skill instead.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/backend/testing.html
- https://www.odoo.com/documentation/19.0/developer/reference/cli.html
