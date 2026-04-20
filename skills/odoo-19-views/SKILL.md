---
name: odoo-19-views
description: Use when authoring or modifying Odoo 19 views — building a new view type from scratch, customizing one via js_class, writing field or view widgets, parsing arch XML (options=, invisible/readonly/required), or adding XPath inheritance. Triggers on mentions of registry.category("views"|"fields"|"view_widgets"), the View/Controller/Renderer/Model split, ArchParser, or any built-in arch (kanban/graph/pivot/calendar/activity/hierarchy/search). Do not use for pure OWL component questions (use the OWL skill) or 18→19 migration (use odoo-v19-migration).
---

# Odoo 19 Views

Authoring guide for Odoo 19 views: built-in (kanban, graph, pivot, calendar, activity, hierarchy, search), brand-new custom view types, field widgets, and view widgets. Every claim is verified against the `19.0` branch of `odoo/odoo` or labelled **UNVERIFIED**.

## Quick reference — pick your path

| I want to... | Start here | Then | 
|---|---|---|
| Understand the architecture | [references/view-architecture.md](./references/view-architecture.md) | — |
| Build a brand-new view type | [references/view-registration.md](./references/view-registration.md) | [examples/custom-view-minimal.md](./examples/custom-view-minimal.md) → [examples/gallery-view-full.md](./examples/gallery-view-full.md) |
| Customize a view via `js_class` | [references/view-registration.md](./references/view-registration.md) §4 | — |
| Add/remove/move nodes in another addon's view | [references/view-inheritance.md](./references/view-inheritance.md) | [examples/view-inheritance.md](./examples/view-inheritance.md) |
| Author a `<field widget="…">` | [references/field-widgets.md](./references/field-widgets.md) | [examples/field-widget.md](./examples/field-widget.md) |
| Author a `<widget name="…">` | [references/view-widgets.md](./references/view-widgets.md) | [examples/view-widget.md](./examples/view-widget.md) |
| Look up arch attributes / modifiers | [references/arch-xml.md](./references/arch-xml.md) | — |
| Look up built-in view arch skeletons | [references/built-in-views.md](./references/built-in-views.md) | — |
| Enterprise views (gantt, map, cohort, grid) | [references/enterprise-views.md](./references/enterprise-views.md) (**UNVERIFIED**) | — |
| Pre-commit sanity check | [references/best-practices.md](./references/best-practices.md) | — |

## Mental model

A view is **five pieces glued together by `registry.category("views")`**:

| Piece | Role | Standard impl |
|---|---|---|
| **ArchParser** | Reads XML → `archInfo` object. Synchronous, no OWL. | Custom per view type |
| **Model** | Data layer. | `RelationalModel` (CRUD) or custom (display-only views like graph/calendar) |
| **Renderer** | Pure OWL component. Draws `model.root`. Never fetches. | Custom per view type |
| **Controller** | OWL root. Owns `Layout` (control panel + search panel). Wires Model → Renderer. | Custom per view type |
| **View descriptor** | Plain JS object `{type, Controller, Renderer, Model, ArchParser, props, …}` registered under `registry.category("views")`. | Required |

A sixth optional **Compiler** transpiles arch → OWL templates at runtime (used by form and kanban).

The generic `View` component (`addons/web/static/src/views/view.js`) resolves the descriptor from the registry, calls `descr.props(genericProps, descr, env.config)` to build controller props, and mounts the Controller inside `WithSearch`. Full architecture: [references/view-architecture.md](./references/view-architecture.md).

## Bootstrapping a new view type — four places to touch

1. **Extend `ir.ui.view.type`** (Python) — add the type to the Selection so XML validates `<my_type>` as a root and `type="my_type"` on `ir.ui.view`. Also override `_get_view_info` on `ir.ui.view` (the JS registry checks `type in session.view_info`).
2. **Extend `ir.actions.act_window.view.view_mode`** (Python) — *only* required if you declare the type on a `<view>` child of `ir.actions.act_window`. Comma-separated `view_mode="list,form,my_type"` does NOT need this (the field on `ir.actions.act_window` is a free-form `Char`).
3. **Register the JS descriptor** — `registry.category("views").add("my_type", myView)`.
4. **Ship an arch** — `<record model="ir.ui.view"> type="my_type"` with `<my_type>…</my_type>` body.

Step-by-step: [references/view-registration.md](./references/view-registration.md). Paste-ready minimal: [examples/custom-view-minimal.md](./examples/custom-view-minimal.md). Full worked example: [examples/gallery-view-full.md](./examples/gallery-view-full.md) (tracks `awesome_gallery` on `odoo/tutorials@19.0`).

## Customizing an existing view via `js_class`

```xml
<xpath expr="//kanban" position="attributes">
    <attribute name="js_class">my_kanban</attribute>
</xpath>
```

```js
registry.category("views").add("my_kanban", {
    ...kanbanView,
    Renderer: MyKanbanRenderer,
});
```

Resolution order is `arch@js_class` → `props.jsClass` → `type` (verified `addons/web/static/src/views/view.js:344`). Full pattern: [references/view-registration.md](./references/view-registration.md) §4.

## Red flags — arch mistakes that hard-fail or silently break

| Pattern | Status | Fix |
|---|---|---|
| `attrs="{'invisible': [...]}"` | Removed in 17. Raises `ValidationError` at view load. | `invisible="not field"` directly on the node |
| `states="draft,confirmed"` | Removed in 17 | `invisible="state not in ('draft','confirmed')"` |
| `<tree>` root | Removed in 17 | `<list>` |
| `JSON.parse(options)` on `<field>` | Wrong — `<field options>` is **py.js** | Trust the pre-parsed `options` prop in `extractProps` |
| Skipping `JSON.parse` on `<button options=…>` | `<button options>` IS strict JSON | `JSON.parse(button.options)` |
| Mutating `record.data` directly | Wrong | `record.update({field: value})` |
| Reading arch attrs inside a component | Components see only props | Move logic to `extractProps` |
| Custom widget without spreading standard props | Misses required props | Always `…standardFieldProps` (or `…standardWidgetProps`) |

Full rules: [references/arch-xml.md](./references/arch-xml.md), [references/best-practices.md](./references/best-practices.md).

## Field widgets vs view widgets — at a glance

|  | Field widget | View widget |
|---|---|---|
| Arch | `<field name="x" widget="…"/>` | `<widget name="…"/>` |
| Registry | `registry.category("fields")` | `registry.category("view_widgets")` |
| Component receives | A specific record's field value | The record (no specific field) |
| Standard props | `standardFieldProps` | `standardWidgetProps` |
| Per-view variant | `"list.phone"`, `"form.phone"` | Same prefix mechanism available |

Deep dives: [references/field-widgets.md](./references/field-widgets.md), [references/view-widgets.md](./references/view-widgets.md). Paste-ready: [examples/field-widget.md](./examples/field-widget.md), [examples/view-widget.md](./examples/view-widget.md).

## Verification status

- **Open-source views** (`list, form, kanban, graph, pivot, calendar, search, qweb` + community-shipped `activity`, `hierarchy`) — verified against `odoo/odoo@19.0`.
- **Enterprise views** (`gantt, map, cohort, grid`) — code lives in the private `odoo/enterprise` repo. All enterprise arch claims in this skill are inferred from Odoo 18.0 docs and cross-version continuity. Flagged **UNVERIFIED FOR 19.0** in [references/enterprise-views.md](./references/enterprise-views.md).
- **Gallery tutorial** ([references/custom-view-tutorial.md](./references/custom-view-tutorial.md)) uses 18.0 walkthrough text (Odoo removed the 19.0 docs page); every API it calls is verified in 19.0 source.
- **`ir.ui.view.type` core selection in 19.0** is 8 entries: `list, form, graph, pivot, calendar, kanban, search, qweb`. All others are added by their addons via `selection_add=[…]`.
- **`options="…"` parsing**: py.js (`evaluateExpr`, accepts `True`/`'str'`/`None`) on `<field>`, but strict `JSON.parse` on `<button>`. Verified in `addons/web/static/src/views/fields/field.js`.
