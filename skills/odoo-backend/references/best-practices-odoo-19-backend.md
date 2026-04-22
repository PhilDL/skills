---
name: best-practices-odoo-19-backend
description: Final review checklist for Odoo 19 backend work, including version-specific API shifts, common anti-patterns, and the fastest sanity checks before shipping.
---

# Odoo 19 Backend Best Practices

Use this as the final pass after you already know which backend surface you are touching.

## Odoo 19 backend deltas worth remembering

- Prefer `Domain(...)` composition over hand-built domain lists when logic is non-trivial.
- Prefer `_read_group` for backend grouping work; backend `read_group` is deprecated in favor of `_read_group`.
- `@api.private` exists to explicitly mark non-RPC backend helpers.
- Prefer `search_fetch` / `fetch` when cache warming matters.
- Prefer `odoo.tools.SQL` over hand-built SQL strings.
- Stop reaching for `record._cr`, `record._uid`, and `record._context`; the changelog marks them deprecated. Use `env.cr`, `env.uid`, and `env.context`.

## Review checklist

- [ ] The method works on empty, singleton, and multi-record `self` where applicable.
- [ ] Singleton-only methods call `ensure_one()`.
- [ ] Public methods do not trust `self`, incoming params, or context blindly.
- [ ] ACLs and record rules were considered together, not separately.
- [ ] Dynamic field access uses `record[field_name]`, not `getattr(...)`.
- [ ] ORM is used before raw SQL; if SQL is used, it flushes first and invalidates after writes.
- [ ] Computed fields declare accurate dependencies and do not hide business invariants in `onchange`.
- [ ] Batch work uses `_read_group`, batch `create`, or recordset-wide searches instead of per-record queries.
- [ ] External integrations use JSON-2 unless an existing legacy RPC client must be maintained.
- [ ] Tests cover the intended backend contract, and query counts are asserted when performance is the point.

## High-signal anti-patterns

| Anti-pattern | Why it hurts | Fix |
| --- | --- | --- |
| Overriding `create()` without `@api.model_create_multi` | Breaks or slows batch creation | Use multi-create override shape |
| Doing security only in views | RPC and direct writes still hit the model | Enforce in Python, ACLs, and rules |
| Using `onchange` for invariants | Only covers form editing | Move invariants to business methods or constraints |
| Raw SQL `UPDATE` without `invalidate_*` and `modified(...)` | Stale cache and skipped recomputes | Flush, write SQL, invalidate, mark modified |
| Separate `search` then `read` in external integrations | Two network calls and concurrency window | Use `search_read` or one custom action method |
| Calling cron logic from normal code paths | Scheduler semantics differ | Extract shared helper and keep cron wrapper thin |
| Multiple global record rules | Easy to over-restrict | Prefer fewer globals and explicit group rules |

## Ship criteria

If the patch changes any of these, expect regressions unless tested:

- security
- multi-company behavior
- stored computed fields
- scheduled jobs
- raw SQL
- external APIs
- reports

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/backend/orm.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/orm/changelog.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/security.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/performance.html
- https://www.odoo.com/documentation/19.0/developer/reference/external_api.html
