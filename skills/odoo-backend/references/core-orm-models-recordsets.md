---
name: core-orm-models-recordsets
description: Model kinds, recordset behavior, inheritance modes, reserved fields, and the backend mental model for writing Python model code that works with Odoo instead of against it.
---

# ORM Models and Recordsets

Write backend code against recordsets, not against rows or ad-hoc SQL. Most bugs in Odoo backend code come from forgetting that `self` may be empty, multi-record, cached, prefetched, or delegated.

## Pick the right model class

```python
from odoo import fields, models


class BusinessTrip(models.Model):
    _name = "business.trip"
    _description = "Business Trip"

    name = fields.Char(required=True)
```

- `models.Model`: normal persisted business records.
- `models.AbstractModel`: shared behavior, no standalone table of business records.
- `models.TransientModel`: wizard/temporary data. Keep `_log_access` enabled.

## Recordsets are ordered collections

Methods are called on recordsets, not a single record by default.

```python
def action_confirm(self):
    for trip in self:
        if trip.state == "draft":
            trip.state = "confirmed"
```

Important consequences:

- `self` may contain 0, 1, or many records.
- iterating yields singletons
- duplicates are still possible in recordsets
- reading a non-relational field on a multi-record recordset raises

Use:

- `self.ensure_one()` when the method is singleton-only
- `self.mapped("field_name")` for non-relational multi-record reads
- set operations `|`, `&`, `-` when staying in recordset land

## Field access is active-record style

```python
trip.name = "Conference 2026"
responsible_name = trip.partner_id.name
dynamic_value = trip[field_name]
```

Prefer `record[field_name]` over `getattr(record, field_name)` when the field name is dynamic. It stays inside the field API instead of exposing arbitrary object attributes.

## Automatic and reserved fields matter

Common automatic fields:

- `id`
- `create_date`, `create_uid`
- `write_date`, `write_uid`
- `display_name`

Reserved field names unlock behavior:

- `name`: display label source
- `active`: archive/unarchive support
- `state`: workflow/status conventions
- `parent_id`, `parent_path`: tree semantics and `child_of` / `parent_of`
- `company_id`: multi-company consistency checks

If you opt into tree semantics with `parent_path`, declare it with `index=True`.

## Declare constraints and indexes as model attributes

```python
class BusinessTrip(models.Model):
    _name = "business.trip"

    name = fields.Char(required=True)
    amount = fields.Float()
    limit = fields.Float()

    _amount_check = models.Constraint(
        "CHECK (amount <= limit)",
        "Amount must stay below the limit.",
    )
    _name_idx = models.Index("(name)")
```

This is the modern attribute-based path documented in the ORM reference and changelog.

## Inheritance modes

### Classical inheritance: new model built from another

```python
class BusinessDocument(models.Model):
    _name = "business.document"

    name = fields.Char()


class BusinessTrip(models.Model):
    _name = "business.trip"
    _inherit = ["business.document"]

    destination = fields.Char()
```

Use when the new model should be its own model name and table semantics.

### Extension: patch an existing model in place

```python
class ResPartner(models.Model):
    _inherit = "res.partner"

    trip_count = fields.Integer()
```

Use when augmenting a model from another module.

### Delegation: composition via `_inherits`

```python
class TripProfile(models.Model):
    _name = "trip.profile"
    seat_preference = fields.Char()


class BusinessTrip(models.Model):
    _name = "business.trip"
    _inherits = {"trip.profile": "profile_id"}

    profile_id = fields.Many2one("trip.profile", required=True, ondelete="cascade")
```

Warnings from the docs still apply:

- fields delegate, methods do not
- chained `_inherits` remains fragile
- avoid `_inherits` unless the composition benefit is real

## Field incremental definition

When extending a model, you can redefine a field with the same type to override attributes:

```python
class BusinessTrip(models.Model):
    _inherit = "business.trip"

    state = fields.Selection(help="Trip lifecycle state.")
```

That is the supported way to refine metadata like `help`, `tracking`, defaults, or string labels.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/backend/orm.html
