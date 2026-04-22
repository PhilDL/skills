---
name: core-domains-sql-and-cache
description: Domain builder patterns, search/read APIs, `_read_group`, `search_fetch`, and the correct raw-SQL workflow with `SQL`, flushing, invalidation, and recomputation.
---

# Domains, SQL, and Cache

This is the backend performance and correctness boundary. Most efficient Odoo backend code comes from using the right domain/query API first, then dropping to SQL only when the ORM is a poor fit.

## Build domains with `Domain(...)`

```python
from odoo.fields import Domain

domain = Domain("invoice_status", "=", "to invoice") & Domain(
    "order_line",
    "any",
    Domain("product_id.qty_available", "<=", 0),
)
```

Why prefer it:

- safer than mutating raw lists
- composable with `&`, `|`, `~`
- serializable back to list form
- supports optimization and validation

## Operators worth remembering

- comparisons: `=`, `!=`, `>`, `>=`, `<`, `<=`
- string matching: `like`, `ilike`, `=like`, `=ilike`
- membership: `in`, `not in`
- hierarchy: `child_of`, `parent_of`
- relational existence: `any`, `not any`

The docs also expose dynamic date parts and dynamic time values in domains:

```python
Domain("birthday.month_number", "=", 2)
Domain("deadline", "<", "today")
Domain("deadline", ">=", "=monday -1w")
```

## Search/read API choices

### Standard CRUD/search

- `browse(ids)`
- `search(domain, ...)`
- `search_count(domain)`
- `read(fields)`
- `fields_get(attributes=[...])`
- `unlink()`

### Prefer combined/batched reads when useful

- `search_fetch(...)`: search and populate cache efficiently
- `fetch(fields)`: warm the cache on an existing recordset
- `_read_group(...)`: backend grouping/aggregation API

The ORM changelog explicitly marks backend `read_group` as deprecated in favor of `_read_group`.

## `_read_group` is often the fix for N+1 counters

```python
def _compute_expense_count(self):
    counts = self.env["business.expense"]._read_group(
        [("trip_id", "in", self.ids)],
        ["trip_id"],
        ["__count"],
    )
    count_by_trip = dict(counts)
    for trip in self:
        trip.expense_count = count_by_trip.get(trip, 0)
```

## Record cache and prefetch exist to help you

Reading one stored simple field on one record usually prefetches the same simple fields for the whole source recordset.

That means this is good:

```python
partners = self.env["res.partner"].browse(partner_ids)
for partner in partners:
    partner.name
    partner.lang
```

and this is bad:

```python
for partner_id in partner_ids:
    partner = self.env["res.partner"].browse(partner_id)
    partner.name
```

## Raw SQL: use `SQL(...)`, not string interpolation

```python
from odoo.tools import SQL

self.env["business.trip"].flush_model(["state"])
self.env.cr.execute(
    SQL("SELECT id FROM business_trip WHERE state = %s"),
    ["draft"],
)
trip_ids = [row[0] for row in self.env.cr.fetchall()]
```

Raw SQL bypasses ORM security and ORM cache semantics. Treat it as an optimization or expressiveness escape hatch, not the default.

## Flush before reading with SQL

Delayed writes and recomputations mean the database may lag behind in-memory ORM state.

Targeted APIs:

- `self.env.flush_all()`
- `model.flush_model(["field"])`
- `records.flush_recordset(["field"])`

Be specific when possible.

## Invalidate after mutating with SQL

```python
from odoo.tools import SQL

Trip = self.env["business.trip"]
Trip.flush_model(["state"])
self.env.cr.execute(
    SQL("UPDATE business_trip SET state = %s WHERE state = %s RETURNING id"),
    ["confirmed", "draft"],
)
ids = [row[0] for row in self.env.cr.fetchall()]
records = Trip.browse(ids)
records.invalidate_recordset(["state"])
records.modified(["state"])
```

Sequence to remember when SQL writes bypass the ORM:

1. flush relevant fields
2. execute SQL
3. invalidate caches
4. call `modified(...)` if computed-field dependencies changed

## Use `Environment.execute_query(...)` when it fits

The ORM reference lists `Environment.execute_query` as a useful environment method. Prefer framework helpers when they already encode flushing/access behavior rather than hand-rolling cursor logic everywhere.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/backend/orm.html
