---
name: odoo-frontend
description: "Use when creating, editing, debugging, or reviewing Odoo 19 frontend or web-client code in JavaScript, XML, QWeb, or frontend addon assets: `@odoo-module`, `@web/...` imports, `web.assets_backend`, services, registries, hooks, systray items, client actions, command-palette actions, lazy client actions, browser-backed frontend state, patches, generic components, view architecture, built-in or custom views, `js_class`, `searchModel`, field widgets, view widgets, arch XML, modifiers, `options=`, or XPath inheritance. Triggers include `useService`, `browser.localStorage`, `LazyComponent`, `loadJS`, `searchModel.createNewFilters`, `fuzzyLookup`, `command_provider`, `patch`, `registry.category(\"views\"|\"fields\"|\"view_widgets\"|\"systray\"|\"lazy_components\")`, `ArchParser`, `Controller`/`Renderer`/`Model`, `buildM2OFieldDescription`, `standardFieldProps`, `standardWidgetProps`, `kanban`, `list`, `form`, `graph`, `pivot`, `calendar`, `search`, `xpath`, and `field widget=`. Pair with `owl` for Owl internals and `odoo-19-javascript-testing` for Hoot, web test helpers, and mock-server work. Do not use for broader backend ORM or server-side business logic."
metadata:
  author: Philippe L'ATTENTION
  version: "2026.4.22"
  source: Generated from https://github.com/odoo/documentation, merged with source-verified view references from https://github.com/odoo/odoo, expanded with tutorial-derived frontend patterns from master_odoo_web_framework, and cross-checked against local solution addons in `sources/odootutorials`; scripts located at https://github.com/phildl/skills
---

> The skill is based on Odoo 19.0 documentation, source-verified view references, tutorial-derived frontend patterns, and local solved tutorial addons, merged at 2026-04-22.

# Odoo 19 Frontend

This skill covers the Odoo 19 frontend surface as one skill: web-client runtime, frontend JavaScript, views, widgets, arch XML, and XPath inheritance. Start from the narrowest reference that matches the task, and load examples only when you need paste-ready scaffolding.

It intentionally stops at frontend-facing Python glue for views such as `selection_add`, `_get_view_info`, `ir.actions.act_window.view`, and XML arch authoring. For broader backend ORM or business logic work, read the target module directly until a dedicated backend skill exists.

## Quick Route

Do not read every reference up front. Start from the slice that matches the task.

| If the task is about... | Read |
| --- | --- |
| Web client architecture, env, action context, `Domain`, `evaluateExpr`, `env.bus`, debug modes, client actions | [core-architecture-runtime](references/core-architecture-runtime.md) |
| Asset bundles, manifest operations, lazy asset loading, named lazy bundles, `LazyComponent`, `loadJS`, `@odoo-module`, aliases, import rules | [core-assets-and-modules](references/core-assets-and-modules.md) |
| `useService`, `orm` vs `rpc`, notifications, router, effect, title, user service | [core-services](references/core-services.md) |
| Systray items, popover client actions, command-palette actions, shared frontend state, `Reactive` models, browser-backed persistence | [features-client-actions-and-shared-state](references/features-client-actions-and-shared-state.md) |
| Registry categories, sequence ordering, systray, `main_components`, `command_provider`, `lazy_components`, action registry | [core-registries-and-extension-points](references/core-registries-and-extension-points.md) |
| Odoo-provided hooks like `useBus`, `usePosition`, `usePager`, `useSpellCheck` | [features-hooks](references/features-hooks.md) |
| Odoo generic components such as `Dropdown`, `Notebook`, `SelectMenu`, `Pager`, `TagsList` | [features-generic-components](references/features-generic-components.md) |
| Safe, minimal use of `patch(...)` | [features-patching-code](references/features-patching-code.md) |
| Error service, `error_handlers`, Owl `onError`, expected vs unexpected failures | [features-error-handling](references/features-error-handling.md) |
| Classical QWeb, template inheritance, debug hooks, `core.qweb.render` | [features-qweb-templates](references/features-qweb-templates.md) |
| Odoo Editor Powerbox or mobile bridge APIs | [features-editor-and-mobile](references/features-editor-and-mobile.md) |
| View descriptor, `Controller` / `Renderer` / `Model` / `ArchParser`, or `WithSearch` resolution | [view-architecture](references/view-architecture.md) |
| Build a brand-new view type or customize one via `js_class` | [view-registration](references/view-registration.md), then [custom-view-minimal](examples/custom-view-minimal.md) or [gallery-view-full](examples/gallery-view-full.md) |
| Extend a built-in kanban with a sidebar, `searchModel`, `fuzzyLookup`, or `t-model` | [advanced-kanban-customization](references/advanced-kanban-customization.md) |
| Built-in view archs for `kanban`, `graph`, `pivot`, `calendar`, `activity`, `hierarchy`, `search` | [built-in-views](references/built-in-views.md) |
| Root tags, modifiers, `options=`, `groups=`, or removed `attrs=` / `states=` patterns | [arch-xml](references/arch-xml.md) |
| Add, move, replace, or mutate nodes with XPath inheritance | [view-inheritance](references/view-inheritance.md), then [view-inheritance example](examples/view-inheritance.md) |
| Author a custom `<field widget="...">` | [field-widgets](references/field-widgets.md), then [field-widget example](examples/field-widget.md) |
| Author a custom `<widget name="...">` | [view-widgets](references/view-widgets.md), then [view-widget example](examples/view-widget.md) |
| Enterprise-only view types (`gantt`, `map`, `cohort`, `grid`) | [enterprise-views](references/enterprise-views.md) |
| Full gallery-view walkthrough and provenance notes | [custom-view-tutorial](references/custom-view-tutorial.md) |
| Where JS tests live, how they are bundled, and where to run them | [testing-unit-test-entry](references/testing-unit-test-entry.md) |
| Final review pass before shipping frontend code | [best-practices-frontend-workflow](references/best-practices-frontend-workflow.md), then [best-practices](references/best-practices.md) for view-specific checks |

## Mental Model

A view is five pieces glued together by `registry.category("views")`:

| Piece | Role | Standard impl |
| --- | --- | --- |
| `ArchParser` | Reads XML into `archInfo`. Synchronous, no Owl. | Custom per view type |
| `Model` | Data layer. | `RelationalModel` or a custom model |
| `Renderer` | Pure Owl component. Draws `model.root`. Never fetches. | Custom per view type |
| `Controller` | Root Owl component. Owns layout and wires Model to Renderer. | Custom per view type |
| View descriptor | Plain object with `type`, `Controller`, `Renderer`, `Model`, `ArchParser`, `props`, and optional extras | Required |

A sixth optional `Compiler` converts arch XML into Owl templates at runtime for views such as `form` and `kanban`. Use [view-architecture](references/view-architecture.md) for the full descriptor catalogue and runtime resolution path.

## Red flags — arch mistakes that hard-fail or silently break

| Pattern | Status | Fix |
| --- | --- | --- |
| `attrs="{'invisible': [...]}"` | Removed in 17. Raises `ValidationError`. | Put `invisible=`, `readonly=`, or `required=` directly on the node |
| `states="draft,confirmed"` | Removed in 17 | Rewrite as a direct expression, e.g. `invisible="state not in ('draft', 'confirmed')"` |
| `<tree>` root | Removed in 17 | Use `<list>` |
| `JSON.parse(options)` on `<field>` | Wrong. `<field options>` is py.js, not strict JSON. | Trust the parsed `options` in `extractProps` |
| Skipping `JSON.parse` on `<button options=...>` | Wrong in the other direction | Parse button options as JSON |
| Mutating `record.data` directly | Bypasses model machinery | Use `record.update({...})` |
| Reading raw arch attrs inside a component | Leaks parsing concerns into rendering | Parse in `extractProps` and pass clean props |
| Custom widget without standard props | Breaks prop validation and runtime expectations | Spread `standardFieldProps` or `standardWidgetProps` |
 | New file under */static/src/ not referenced in __manifest__.py | Loads 0 bytes at runtime (silent — typecheck passes). | Add to assets.web.assets_backend in the same diff. |

## Core Runtime References

| Topic | Description | Reference |
| --- | --- | --- |
| Architecture Runtime | SPA structure, environment, contexts, Python expression helpers, domains, bus, browser facade, client actions | [core-architecture-runtime](references/core-architecture-runtime.md) |
| Assets and Modules | Bundles, manifest directives, load order, lazy loading, ES-module transpilation, aliases, transpiler limits | [core-assets-and-modules](references/core-assets-and-modules.md) |
| Services | Service contract, `useService`, `orm` vs `rpc`, notification/router/effect/title/user patterns | [core-services](references/core-services.md) |
| Registries and Extension Points | Registry API, ordered categories, systray, `main_components`, actions, formatters/parsers | [core-registries-and-extension-points](references/core-registries-and-extension-points.md) |

## Features

| Topic | Description | Reference |
| --- | --- | --- |
| Hooks | Odoo-specific hooks on top of Owl: assets, autofocus, bus, pager, positioning, spellcheck | [features-hooks](references/features-hooks.md) |
| Generic Components | Odoo-built UI primitives: ActionSwiper, CheckBox, ColorList, Dropdown, Notebook, Pager, SelectMenu, TagsList | [features-generic-components](references/features-generic-components.md) |
| Client Actions and Shared State | Tutorial-derived patterns for systray items, popover tools, command-palette actions, shared service state, and browser persistence | [features-client-actions-and-shared-state](references/features-client-actions-and-shared-state.md) |
| Patching Code | Safe patch timing, `super`, class vs prototype patching, unpatching for tests | [features-patching-code](references/features-patching-code.md) |
| Error Handling | Error service flow, `error_handlers`, Owl `onError`, Promise rejection rules | [features-error-handling](references/features-error-handling.md) |
| QWeb Templates | Classical QWeb directives, safe output, inheritance, JS debug hooks, `core.qweb` | [features-qweb-templates](references/features-qweb-templates.md) |
| Editor and Mobile | Powerbox customization and the native mobile bridge APIs | [features-editor-and-mobile](references/features-editor-and-mobile.md) |

## Views and Widgets

| Topic | Description | Reference |
| --- | --- | --- |
| View Architecture | Descriptor keys, runtime resolution, `View` / `WithSearch`, standard props contracts | [view-architecture](references/view-architecture.md) |
| View Registration | Add a new view type end-to-end or override one with `js_class` | [view-registration](references/view-registration.md) |
| Advanced Kanban Customization | Tutorial-derived patterns for sidebars, `searchModel`, `t-model`, and pager coordination in `js_class` kanban variants | [advanced-kanban-customization](references/advanced-kanban-customization.md) |
| Built-in Views | Arch shapes and parser-backed attributes for Odoo's built-in view types | [built-in-views](references/built-in-views.md) |
| Arch XML | Root tags, modifiers, `context`, `domain`, `groups`, `options`, and removed patterns | [arch-xml](references/arch-xml.md) |
| View Inheritance | XPath positions, attribute combiners, `move`, and `mode="primary"` vs `extension` | [view-inheritance](references/view-inheritance.md) |
| Field Widgets | `fields` registry, descriptor shape, `standardFieldProps`, `fieldDependencies`, writes | [field-widgets](references/field-widgets.md) |
| View Widgets | `view_widgets` registry, descriptor shape, `standardWidgetProps`, widget parsing | [view-widgets](references/view-widgets.md) |
| Enterprise Views | Publicly inferable guidance for `gantt`, `map`, `cohort`, and `grid` | [enterprise-views](references/enterprise-views.md) |
| Custom View Tutorial | Gallery-view walkthrough notes reconciled across 18.0 docs and 19.0 source | [custom-view-tutorial](references/custom-view-tutorial.md) |

## Examples

| Topic | Description | Reference |
| --- | --- | --- |
| Minimal Custom View | Smallest runnable brand-new view type with Python, JS, and XML pieces | [custom-view-minimal](examples/custom-view-minimal.md) |
| Gallery View | Full custom view with model, renderer, pagination, and click-to-form flow | [gallery-view-full](examples/gallery-view-full.md) |
| Field Widget | Paste-ready custom `<field widget="color_pill">` example | [field-widget](examples/field-widget.md) |
| View Widget | Paste-ready custom `<widget name="banner">` example | [view-widget](examples/view-widget.md) |
| View Inheritance | Common XPath snippets for adding, replacing, moving, and mutating nodes | [view-inheritance](examples/view-inheritance.md) |

## Testing

| Topic | Description | Reference |
| --- | --- | --- |
| Unit Test Entry | File placement, naming, asset bundle wiring, `/web/tests`, and when to switch to the dedicated testing skill | [testing-unit-test-entry](references/testing-unit-test-entry.md) |

## Best Practices

| Topic | Description | Reference |
| --- | --- | --- |
| Frontend Workflow | High-signal checklist for modules, bundles, services, translations, session data, patches, and testing | [best-practices-frontend-workflow](references/best-practices-frontend-workflow.md) |
| Views and Widgets | View-authoring checklist covering arch XML, registration, widgets, state flow, and performance | [best-practices](references/best-practices.md) |

## Cross-Skill Guidance

- Use the [owl skill](../owl/SKILL.md) when the task is about Owl component internals, lifecycle, reactivity, props, slots, or template semantics.
- Use the [odoo-19-javascript-testing skill](../odoo-19-javascript-testing/SKILL.md) when the task needs Hoot assertions, `mountWithCleanup`, `mountView`, `defineModels`, or mock-server control.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/frontend/framework_overview.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/javascript_reference.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/assets.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/javascript_modules.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/services.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/registries.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/hooks.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/owl_components.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/patching_code.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/error_handling.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/qweb.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/odoo_editor.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/mobile.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/unit_testing.html
- https://github.com/odoo/documentation/tree/19.0/content/developer/tutorials/master_odoo_web_framework
- https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html
- https://github.com/odoo/odoo/tree/19.0/addons/web/static/src/views
- https://github.com/odoo/odoo/tree/19.0/addons/web_hierarchy
- https://github.com/odoo/tutorials/tree/19.0/awesome_gallery
- `sources/odootutorials/awesome_clicker`
- `sources/odootutorials/awesome_dashboard`
- `sources/odootutorials/awesome_shelter`
