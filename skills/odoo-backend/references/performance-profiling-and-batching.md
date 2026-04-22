---
name: performance-profiling-and-batching
description: Odoo profiler usage, query-count checks, batching patterns, prefetch-friendly code, algorithmic complexity fixes, and when to add indexes.
---

# Performance, Profiling, and Batching

The fastest Odoo backend optimization is usually not micro-optimizing Python. It is reducing query count, keeping work batched, and making the ORM do coherent work on recordsets.

## Start with the profiler

The backend docs expose Odoo's built-in profiler:

- UI enablement from developer tools
- Python-side `Profiler(...)`
- `self.profile()` in tests

```python
with self.profile():
    with self.assertQueryCount(__system__=1211):
        self.env["business.trip"]._build_dashboard()
```

## Collectors

Main collectors:

- `sql` / `SqlCollector`
- `traces_async` / `PeriodicCollector`
- `qweb` / `QwebCollector`
- `traces_sync` / `SyncCollector`

Practical guidance:

- start with SQL + periodic traces
- use sync only when you need exact control-flow tracing and accept heavy overhead

## Batch operations by default

Classic anti-pattern:

```python
def _compute_expense_count(self):
    for trip in self:
        trip.expense_count = self.env["business.expense"].search_count(
            [("trip_id", "=", trip.id)]
        )
```

Better:

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

## Batch `create()`

Bad:

```python
for vals in values_list:
    self.env["business.trip"].create(vals)
```

Better:

```python
self.env["business.trip"].create(values_list)
```

That gives the framework room to optimize field computation and reduces ORM overhead.

## Keep prefetch working

Bad:

```python
for trip_id in trip_ids:
    trip = self.browse(trip_id)
    trip.name
```

Better:

```python
trips = self.browse(trip_ids)
for trip in trips:
    trip.name
```

## Reduce algorithmic complexity

Replace nested loops with maps or sets.

```python
mapped_result = {row["id"]: row["foo"] for row in results}
for record in self:
    record.foo = mapped_result.get(record.id)
```

Also prefer set membership over repeated list membership checks when the collection is large.

## Add indexes surgically

```python
name = fields.Char(index=True)
```

Indexes help searches but cost space and slow `INSERT` / `UPDATE` / `DELETE`. Add them where lookup patterns justify them, not everywhere.

## Profiling pitfalls from the docs

- cache warmness changes results
- profiler overhead can distort very chatty SQL workloads
- long traces can blow memory limits
- blocking C calls can look strange in periodic traces

Interpret profiler output as evidence, not as absolute truth.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/backend/performance.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/testing.html
