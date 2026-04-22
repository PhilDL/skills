---
name: odoo-backend
description: "Use when creating, editing, debugging, or reviewing Odoo 19 backend/server code in Python or XML data: `models.Model`, `fields.*`, `@api.depends`, `@api.onchange`, `@api.constrains`, `@api.model_create_multi`, `env`, `sudo`, `with_context`, `search`, `_read_group`, `Domain`, `env.cr`, `__manifest__.py`, `ir.model.access.csv`, `ir.rule`, `@route`, `ir.actions.server`, `ir.cron`, QWeb reports, `TransactionCase`/`HttpCase`, JSON-2 `/json/2`, or legacy `execute_kw` RPC. Not for Owl/web-client JavaScript, frontend assets, or custom views/widgets except when they are incidental to a backend change."
metadata:
  author: Philippe L'ATTENTION
  version: "2026.4.22"
  source: Generated from https://github.com/odoo/documentation, scripts located at https://github.com/phildl/skills
---

> The skill is based on Odoo 19.0 backend and external API documentation, generated at 2026-04-22.

# Odoo 19 Backend

This skill covers the server-side Odoo surface: module layout, Python models, ORM, security, controllers, APIs, reports, tests, and performance. Start from the narrowest reference that matches the task, then load the checklist last for a final review pass.

## Quick Route

Do not read every reference up front. Start from the slice that matches the task.

| If the task is about... | Read |
| --- | --- |
| `__manifest__.py`, module layout, XML/CSV loading, `record`/`function` tags, `noupdate` | [core-module-structure-and-data](references/core-module-structure-and-data.md) |
| `models.Model`, `AbstractModel`, `TransientModel`, recordsets, `_inherit`, `_inherits`, reserved fields | [core-orm-models-recordsets](references/core-orm-models-recordsets.md) |
| computed/related fields, date/datetime gotchas, `@api.depends`, `@api.onchange`, `@api.constrains`, `@api.model_create_multi`, `@api.private` | [core-fields-and-decorators](references/core-fields-and-decorators.md) |
| domains, `search_fetch`, `_read_group`, raw SQL, `SQL(...)`, flushing, cache invalidation, `modified(...)` | [core-domains-sql-and-cache](references/core-domains-sql-and-cache.md) |
| ACL CSVs, record rules, field `groups=`, RPC exposure, SQL injection, `safe_eval`, escaping HTML | [core-security-acl-and-rules](references/core-security-acl-and-rules.md) |
| action dicts, `ir.actions.server`, `ir.actions.act_window`, `ir.cron`, `_commit_progress` | [features-actions-and-cron](references/features-actions-and-cron.md) |
| Python controllers, `@route`, request/response objects, controller inheritance | [features-controllers-and-http](references/features-controllers-and-http.md) |
| external integrations, bearer-key JSON-2, `/json/2`, legacy XML-RPC / JSON-RPC `execute_kw` | [features-external-api-and-rpc](references/features-external-api-and-rpc.md) |
| QWeb PDF/HTML reports, paper formats, custom `_get_report_values`, report assets/fonts | [features-qweb-reports](references/features-qweb-reports.md) |
| `mail.thread`, aliases, activities, common backend mixins | [features-common-mixins](references/features-common-mixins.md) |
| `TransactionCase`, `HttpCase`, `Form`, `--test-tags`, tours, query-count assertions | [testing-backend-and-tours](references/testing-backend-and-tours.md) |
| profiling, collectors, batching, prefetch, complexity, indexes | [performance-profiling-and-batching](references/performance-profiling-and-batching.md) |
| final review pass, Odoo 19 backend deltas, common regressions | [best-practices-odoo-19-backend](references/best-practices-odoo-19-backend.md) |

## Mental Model

- A backend module is a Python package plus ordered XML/CSV data loading.
- Business behavior lives on recordsets, not raw rows. Prefer ORM operations first.
- Security is layered: ACLs grant model-level CRUD, record rules filter rows, field `groups` strip field access.
- Public model methods are callable over RPC unless you deliberately make them private.
- Performance is mostly query shape: batch work, leverage prefetch, and use targeted SQL only when ORM is a bad fit.

## Red Flags

| Pattern | Why it breaks | Better path |
| --- | --- | --- |
| Looping `search_count` or `search` per record | N+1 queries | Batch with `_read_group`, prefetch, or one broader search |
| Raw SQL without flush/invalidate | Stale reads or incoherent cache | Use `flush_*`, then invalidate and `modified(...)` when mutating |
| Public button/helper method trusting `self` or params | Any public method is RPC-reachable | Re-check access, keep helpers private, prefer `@api.private` / `_helper` |
| Multiple global record rules on the same model | Easy to intersect into zero access | Minimize globals; prefer carefully scoped group rules |
| `safe_eval` on untrusted text | Still crosses the code/data boundary | Prefer `ast.literal_eval`, `json.loads`, or typed parsers |
| `read()` without `fields=` over RPC | Huge payloads, slower integrations | Ask only for the fields you need |
| Calling cron methods directly | Skips scheduler semantics | Use the scheduler or `method_direct_trigger` |
| Relying on XML-RPC / old JSON-RPC for new integrations | Deprecated in Odoo 19 docs | Prefer JSON-2 `/json/2/<model>/<method>` |

## Core References

| Topic | Description | Reference |
| --- | --- | --- |
| Module Structure and Data | Manifest fields, module layout, XML/CSV data loading, `record`/`field`/`function` semantics | [core-module-structure-and-data](references/core-module-structure-and-data.md) |
| ORM Models and Recordsets | Model kinds, recordset behavior, inheritance modes, reserved fields, constraint/index attrs | [core-orm-models-recordsets](references/core-orm-models-recordsets.md) |
| Fields and Decorators | Computed/related fields, date handling, relational fields, core `odoo.api` decorators | [core-fields-and-decorators](references/core-fields-and-decorators.md) |
| Domains, SQL, and Cache | Domain builder, CRUD/search APIs, `_read_group`, `search_fetch`, raw SQL, flush/invalidate | [core-domains-sql-and-cache](references/core-domains-sql-and-cache.md) |
| Security, ACL, and Rules | ACLs, rules, field groups, RPC/security pitfalls, SQL/domain injection, safe HTML | [core-security-acl-and-rules](references/core-security-acl-and-rules.md) |

## Features

| Topic | Description | Reference |
| --- | --- | --- |
| Actions and Cron | Returned action dicts, server actions, report actions, client actions, scheduled jobs | [features-actions-and-cron](references/features-actions-and-cron.md) |
| Controllers and HTTP | `@route`, controller inheritance, request/response objects, JSON-RPC dispatcher context | [features-controllers-and-http](references/features-controllers-and-http.md) |
| External API and RPC | JSON-2 bearer-key API, transaction model, migration from deprecated XML/JSON-RPC | [features-external-api-and-rpc](references/features-external-api-and-rpc.md) |
| QWeb Reports | Report templates, translation, paper formats, custom render contexts, report assets | [features-qweb-reports](references/features-qweb-reports.md) |
| Common Mixins | `mail.thread`, aliases, activities, `utm.mixin`, website publication, ratings | [features-common-mixins](references/features-common-mixins.md) |

## Testing

| Topic | Description | Reference |
| --- | --- | --- |
| Backend and Tours | Python test classes, test tags, `Form`, `HttpCase`, tours, `assertQueryCount` | [testing-backend-and-tours](references/testing-backend-and-tours.md) |

## Performance

| Topic | Description | Reference |
| --- | --- | --- |
| Profiling and Batching | Odoo profiler, collectors, query counting, batching, prefetch, complexity, indexes | [performance-profiling-and-batching](references/performance-profiling-and-batching.md) |

## Best Practices

| Topic | Description | Reference |
| --- | --- | --- |
| Odoo 19 Backend Checklist | Version-specific backend changes, review checklist, and high-signal anti-patterns | [best-practices-odoo-19-backend](references/best-practices-odoo-19-backend.md) |

## Cross-Skill Guidance

- Use the [odoo-frontend skill](../odoo-frontend/SKILL.md) when the task is primarily web-client JavaScript, views, widgets, arch XML, or frontend assets.
- Use the [odoo-19-javascript-testing skill](../odoo-19-javascript-testing/SKILL.md) when the task is Hoot, web test helpers, mock-server work, or frontend JS testing internals.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/backend/module.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/data.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/orm.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/security.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/actions.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/http.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/reports.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/mixins.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/testing.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/performance.html
- https://www.odoo.com/documentation/19.0/developer/reference/external_api.html
- https://www.odoo.com/documentation/19.0/developer/reference/external_rpc_api.html
