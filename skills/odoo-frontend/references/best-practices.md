# Odoo 19 Views — Best Practices & Anti-Patterns

A curated, source-backed checklist.

## Table of contents

1. Arch authoring
2. View registration and customization
3. Field widgets
4. View widgets
5. State management in views
6. Performance
7. Common anti-patterns

---

## 1. Arch authoring

### DO

- **Use direct modifier attributes.** `invisible="state == 'done'"`, `readonly="locked"`, `required="not draft_mode"`. These evaluate per-record and per-render via py.js.
- **Use `<list>` for list view root.** `<tree>` has been removed since Odoo 17.
- **Use `<t t-name="card">` for kanban.** `<t t-name="kanban-box">` was replaced in Odoo 18+.
- **Use `column_invisible` for list columns that are conditionally absent.** The compiler removes the column entirely rather than just hiding per-row.
- **Use `groups="..."` to strip nodes server-side.** More secure than `invisible=` for fields/buttons that certain users should never see.

### DON'T

- **Don't use `attrs="{'invisible': [...]}"`** — hard-raises `ValidationError` in 19. Migrate to the direct attribute form.
- **Don't use `states="draft,confirmed"`** — same story, removed. Rewrite as `invisible="state not in ('draft','confirmed')"`.
- **Don't mix up `invisible=` and `groups=`.** `invisible` is client-side only (data still flows to the browser). `groups` strips the node entirely server-side.
- **Don't write `options=` as strict JSON on `<field>`** — it's py.js. Example: `options="{'no_create': True}"` (Python `True`, not `true`). On `<button>` it IS `JSON.parse`, so use strict JSON there.

## 2. View registration and customization

### DO

- **Use `js_class` for customization of an existing view type.** It's the documented extension point (`view.js` line 344). Pattern:
  ```xml
  <xpath expr="//kanban" position="attributes">
      <attribute name="js_class">my_kanban</attribute>
  </xpath>
  ```
  ```js
  registry.category("views").add("my_kanban", { ...kanbanView, Renderer: MyKanbanRenderer });
  ```

- **Use `selection_add` for a brand-new view type.** And don't forget `_get_view_info`:
  ```python
  type = fields.Selection(selection_add=[('gallery', "Gallery")])
  def _get_view_info(self):
      return {'gallery': {'icon': 'fa fa-th-large'}} | super()._get_view_info()
  ```

- **Preserve the descriptor shape.** `type`, `Controller` (OWL component), optionally `Renderer`, `Model`, `ArchParser`, `Compiler`, `SearchModel`, `ControlPanel`, `SearchPanel`, `props`.

### DON'T

- **Don't register a view object whose `Controller` isn't an OWL component.** The registry validator rejects it.
- **Don't skip `_get_view_info` when adding a new type.** Without it, `session.view_info["your_type"]` is undefined and the JS validator refuses to mount your view.
- **Don't copy the whole `kanbanView` definition by hand when doing a `js_class` variant.** Spread it: `{ ...kanbanView, Renderer: ... }`. You'll inherit every feature automatically.

## 3. Field widgets

### DO

- **Spread `standardFieldProps`** in your `static props` declaration. OWL's prop validator will fail if `record`/`name`/`readonly` aren't declared.
- **Do all arch parsing in `extractProps`.** The component should receive well-typed props, not raw arch info.
- **Declare `supportedTypes`** on widgets that aren't generic. Gets you a console warning when misused.
- **Declare `supportedOptions`** with proper `label`, `name`, `type`, `help` entries. They're validated at registry add-time and document the API.
- **Declare `fieldDependencies`** when your widget reads other fields on the same record. Otherwise those fields won't be loaded and `record.data[other_field]` is `undefined`.
- **Use `record.update({field: value})` to write.** Routes through the model mutex, triggers onchange, respects savepoints.
- **Use `useService("orm")`** for ad-hoc RPC. Don't create your own XHR or fetch directly.
- **Prefix your registration** if behavior differs per view type: `registry.category("fields").add("list.phone", listPhoneField)`.

### DON'T

- **Don't mutate `record.data.foo = value`.** Bypasses the mutex, onchange, dirty tracking, savepoints. Anything interesting in Odoo's data layer relies on `record.update`.
- **Don't read arch attributes inside the component.** Parse them in `extractProps` and pass clean props.
- **Don't forget `isRelationalField` in your `supportedOptions` entries.** It's required (for field widgets) by the validator schema (`field.js` lines 39–63).
- **Don't use `JSON.parse` in your head when reading `options`.** The framework already parsed it as py.js — `staticInfo.options` is already an object with Python-typed values.

## 4. View widgets

### DO

- **Spread `standardWidgetProps`** in `static props`.
- **Use `<widget name="..."/>` over inventing a new field widget** when you don't need a field binding.
- **Use `supportedAttributes` for XML attributes (non-`options`).** They appear in `staticInfo.attrs`.
- **Read `this.props.record` and call `record.update` for writes.** Same rules as field widgets.

### DON'T

- **Don't try to declare `supportedTypes`** on a view widget — not in the validation schema (no field type to constrain).
- **Don't read `this.props.name`** — view widgets don't have one.

## 5. State management in views

### DO

- **Put your model in `useSubEnv({ model })`** so descendants can read `this.env.model` instead of receiving it as a prop. This is what `ListController` does — it lets deeply nested cells/widgets reach the model without prop-drilling.
- **Use `useModel` for single-record views (form-like)** and `useModelWithSampleData` for multi-record (list-like). The latter shows demo data when the result set is empty *and* the model has no real records yet — the empty-state UX every list/kanban gives you for free.
- **Wrap the model in `useState(...)`** in the Controller. This is what makes the renderer re-render when the model mutates `records`/`offset`/`total`. Without `useState`, OWL has no reactive dependency on the model and you'll see stale UI after `load()`.
- **Return `{ ...genericProps, archInfo, Model, Renderer }` from `descr.props`.** Don't drop `genericProps` — those include `resModel`, `domain`, `context`, `display`, plus a stack of internals the framework relies on. Spread first, override second.

### DON'T

- **Don't store derived state in the model.** Compute it in getters on the controller/renderer and leverage reactivity. Storing derived state means you have to remember to invalidate it on every mutation — and you will forget at least once.
- **Don't fetch data in the Renderer.** Renderers are pure functions of `props` (this is how `js_class` swap-in works). Fetch in the Model, trigger via the Controller's `onWillStart`/`onWillUpdateProps`. A renderer that fetches can't be reused by a sibling controller, which kills the whole "extend by swapping the Renderer" pattern.

## 6. Performance

### DO

- **Use `KeepLast` from `@web/core/utils/concurrency`** around long RPC calls when the user can trigger a new request before the previous one resolves.
- **Use `bin_size: true` in `webSearchRead` context** when reading image fields. Without it, full base64 content is embedded in the payload.
- **Use `/web/image` URLs with a `write_date` query param** for cache-busting. Without the write_date, browsers cache stale thumbnails.
- **Load heavy libs lazily** via `loadJs`/`loadBundle` from `@web/core/assets`. Chart.js, signature libs, etc. shouldn't ship in the default backend bundle.
- **Use the lazy bundle `web.assets_backend_lazy`** for code only needed after a view switch. `view.js` already knows how to fetch it when a registry key is missing.

### DON'T

- **Don't put gigantic images in the default controller template.** Use `<img t-att-src="...">` with lazy decoding.
- **Don't keep stale records around.** The Model's `load()` should fully replace `records`, not append.

## 7. Anti-patterns to avoid

| Anti-pattern | Why it's bad | Fix |
|---|---|---|
| `record.data.x = 42` | Bypasses mutex, onchange, savepoints | `record.update({x: 42})` |
| `options='{"x": true}'` on `<field>` | Wrong parser assumption — it's py.js | Use `options="{'x': True}"` |
| `attrs="{'invisible': [('a','=',False)]}"` | Removed in 17 | `invisible="not a"` |
| `states="draft,confirmed"` | Removed in 17 | `invisible="state not in ('draft','confirmed')"` |
| Skipping `_get_view_info` for a new view type | JS validator refuses the type | Override `_get_view_info` on `ir.ui.view` |
| Reading arch in a widget component | Coupling, unreadable | Parse in `extractProps` |
| Fetching in the Renderer | Mixes concerns, breaks reusability | Fetch in Model via Controller |
| Hardcoding a view's layout in the Controller template | Locks out `js_class` Renderer swaps; loses control-panel/searchpanel slots | Wrap in `<Layout>` and render the renderer with `<t t-component="props.Renderer" .../>` |
| Relying on a `<tree>` root | Removed in 17 | Use `<list>` |
| `<t t-name="kanban-box">` | Removed in 18 | `<t t-name="card">` |
| Using `JSON.parse` mindset on `<field options="...">` | py.js accepts Python literals — mismatched quotes/booleans | Use Python syntax: single quotes, `True`/`False`/`None` |
| Putting a `<page>` outside a `<notebook>` | Server-side validator raises error | Wrap in `<notebook>` |
| `groups=` used as a runtime permission check | It's a compile-time strip; business-logic-level checks need Python | Combine `groups=` in arch with `@api.constrains` / ACL on the model |

## Verification checklist

Before shipping:

- [ ] All `attrs=` and `states=` removed from arches
- [ ] `<list>` used instead of `<tree>`
- [ ] `<t t-name="card">` used instead of `<t t-name="kanban-box">` in kanban
- [ ] New view types have `_get_view_info` override
- [ ] Widget descriptors declare `supportedTypes`/`supportedOptions` where applicable
- [ ] `standardFieldProps` / `standardWidgetProps` spread in custom widgets
- [ ] All writes go through `record.update(...)`
- [ ] All extra sibling fields declared via `fieldDependencies`
- [ ] Image fields read with `bin_size: true` or via `/web/image` URL
- [ ] `KeepLast` around any async user-driven loads
- [ ] `groups=` used for secret fields, not just `invisible=`

## Sources referenced in this file

- `addons/web/static/src/views/view_compiler.js` — modifier compilation
- `addons/web/static/src/views/fields/field.js` — field widget parsing/validation
- `addons/web/static/src/views/widgets/widget.js` — view widget parsing/validation
- `addons/web/static/src/model/relational_model/record.js` — `record.update`
- `odoo/addons/base/models/ir_ui_view.py` — `attrs=`/`states=` error path
- `addons/web/static/src/views/utils.js` — button `options` JSON parsing
