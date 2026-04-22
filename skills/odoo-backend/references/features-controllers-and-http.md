---
name: features-controllers-and-http
description: Odoo web controllers, route inheritance rules, and the request/response API for backend endpoints that should not be modeled as plain ORM methods.
---

# Controllers and HTTP

Use controllers when the integration surface is HTTP-first rather than model-first: webhooks, custom downloads, custom public endpoints, or flows that must exist before a database is selected.

## Basic controller

```python
from odoo import http
from odoo.http import request


class BusinessTripController(http.Controller):
    @http.route("/business_trip/<int:trip_id>/summary", auth="user", type="http")
    def trip_summary(self, trip_id):
        trip = request.env["business.trip"].browse(trip_id)
        return request.make_json_response({
            "id": trip.id,
            "name": trip.name,
            "state": trip.state,
        })
```

## Route inheritance rule that people forget

When overriding a controller method, you must re-decorate it with `@route()` or the route gets unpublished.

```python
class ExtendedBusinessTripController(BusinessTripController):
    @http.route()
    def trip_summary(self, trip_id):
        response = super().trip_summary(trip_id)
        return response
```

Decorator behavior from the docs:

- no arguments: keep previous route metadata
- provided arguments: override previous metadata

Example:

```python
class RestrictedController(BusinessTripController):
    @http.route(auth="user")
    def webhook(self, **kwargs):
        return super().webhook(**kwargs)
```

## Use controllers sparingly

If the operation is standard business logic over records, keep it on the model and call it through the ORM or JSON-2. If it is transport-specific, file-oriented, webhook-oriented, or auth/routing-specific, a controller is appropriate.

## Core request objects

The backend reference exposes:

- `odoo.http.Request`
- `odoo.http.Response`
- `odoo.http.JsonRPCDispatcher`
- `odoo.http.HttpDispatcher`

That gives you:

- access to `request.env`
- request-scoped context
- response helpers
- JSON-RPC / HTTP dispatch routing

## Use the request environment, not global state

Controller code should operate through `request.env`, just as model code uses `self.env`. That keeps multi-db, auth, and request transaction handling consistent.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/backend/http.html
