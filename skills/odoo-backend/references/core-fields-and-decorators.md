---
name: core-fields-and-decorators
description: High-signal field patterns for Odoo 19 backend code: computed and related fields, date/datetime rules, relational fields, and the decorators that control recomputation, onchange, constraints, and RPC exposure.
---

# Fields and Decorators

The field layer is where Odoo backend code becomes declarative. The goal is to let the framework own recomputation, validation, and UI refresh semantics instead of rebuilding them manually.

## Computed fields

```python
from odoo import api, fields, models


class BusinessTrip(models.Model):
    _name = "business.trip"

    amount = fields.Float()
    tax = fields.Float()
    total = fields.Float(compute="_compute_total", store=True)

    @api.depends("amount", "tax")
    def _compute_total(self):
        for record in self:
            record.total = record.amount + record.amount * record.tax
```

Key rules:

- a compute method must assign the field value
- use `@api.depends(...)` for field dependencies
- dotted dependencies like `line_ids.value` are supported
- stored computed fields become searchable and groupable
- computed fields are readonly unless you add `inverse=...`

If you need backend search support without storing, implement `search=...`.

## Avoid shared inverse methods

The ORM docs explicitly warn against sharing the same inverse method across multiple fields. During inverse computation, sibling inverse-backed fields may be protected and return `False` from cache, which makes cross-field logic unreliable.

## Related fields

```python
nickname = fields.Char(
    related="partner_id.name",
    store=True,
    depends=["partner_id"],
)
```

Good use cases:

- denormalized display fields
- carrying a safe subset of related data onto the current model

Do not chain `One2many` or `Many2many` hops in `related=` expecting aggregated results. The docs explicitly mark that as unsupported.

## Date and datetime rules

Use real `date` / `datetime` objects or proper server-format strings:

- `Date`: `YYYY-MM-DD`
- `Datetime`: `YYYY-MM-DD HH:MM:SS`

Do not compare date strings to datetime strings. String comparison is allowed by Python but semantically wrong for business logic.

Helpers worth using:

```python
date_from = fields.Date.to_date(self.env.context.get("date_from"))
deadline = fields.Datetime.now()
today = fields.Date.context_today(self)
```

Remember:

- datetimes are stored in UTC in PostgreSQL
- timezone conversion is client-managed

## Relational fields

- `Many2one`: single related record
- `One2many`: reverse collection
- `Many2many`: many-to-many collection

Relational access always returns a recordset, even when empty:

```python
country = partner.country_id
lines = order.order_line
```

## Decorators that matter most

### `@api.depends`

Declare recomputation dependencies for computed fields.

### `@api.depends_context`

Use when a computed value depends on context keys rather than only fields.

### `@api.constrains`

Use for cross-field business validation after `create` / `write`.

```python
@api.constrains("date_start", "date_end")
def _check_dates(self):
    for trip in self:
        if trip.date_end and trip.date_start and trip.date_end < trip.date_start:
            raise ValidationError("End date must be after start date.")
```

### `@api.onchange`

UI helper only. It updates in-memory form values; it is not a security or persistence mechanism.

```python
@api.onchange("partner_id")
def _onchange_partner_id(self):
    self.name = f"Trip for {self.partner_id.display_name}" if self.partner_id else False
```

Anything that must hold on RPC or bulk writes belongs in business methods or constraints, not only in `onchange`.

### `@api.model`

Use for model-level methods that do not depend on an initial recordset.

### `@api.model_create_multi`

Prefer this on `create()` overrides so batch record creation keeps working:

```python
@api.model_create_multi
def create(self, vals_list):
    for vals in vals_list:
        vals.setdefault("state", "draft")
    return super().create(vals_list)
```

### `@api.private`

Odoo 18.2+ adds `@api.private` to explicitly distinguish internal Python methods from RPC-exposed methods. In Odoo 19 backend code, treat it as the explicit way to say "not part of the public model API".

## Use `@api.ondelete` instead of overriding `unlink` for validation-only guards

The docs list `ondelete` among the supported decorators. Use it when the goal is preventing deletion under conditions, rather than mixing validation and side effects into a broad `unlink()` override.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/backend/orm.html
