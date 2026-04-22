---
name: core-registries-and-extension-points
description: Registry API, ordered categories, and the main Odoo frontend extension points such as actions, systray, main components, services, and parsers.
---

# Registries and Extension Points

Use registries before patching. They are Odoo's primary extension mechanism.

## Registry basics

All framework registries are subregistries of the root registry from `@web/core/registry`.

```js
import { registry } from "@web/core/registry";

const serviceRegistry = registry.category("services");
const systrayRegistry = registry.category("systray");
const actionRegistry = registry.category("actions");
```

The registry API you actually use:

- `add(key, value, { force?, sequence? })`
- `get(key, defaultValue?)`
- `contains(key)`
- `getAll()`
- `remove(key)`
- `category(name)`

Registries are ordered. `sequence` matters whenever display order matters.

## Prefer these extension points first

### `services`

Register startup services:

```js
registry.category("services").add("myService", myService);
```

### `actions`

Register client actions by tag:

```js
registry.category("actions").add("my_module.dashboard", Dashboard);
```

### `main_components`

Add always-present top-level components rendered by `MainComponentsContainer`.

```js
registry.category("main_components").add("LoadingIndicator", {
  Component: LoadingIndicator,
});
```

The descriptor shape is:

- `Component`
- optional `props`

### `systray`

Use this for navbar-right widgets. The descriptor shape is:

- `Component`
- optional `props`
- optional `isDisplayed(env)`

The docs also note that the root element should be `<li>` for correct styling.

```js
registry.category("systray").add("my_module.item", {
  Component: MySystrayItem,
  isDisplayed: (env) => !env.isSmall,
}, { sequence: 10 });
```

### `effects`

Provide custom effect implementations consumed by the `effect` service.

### `formatters` and `parsers`

Use these for value-formatting or parsing utilities that should plug into field behavior consistently.

## Ordered registries are part of the UI contract

For `systray`, `main_components`, and user-menu-like registries, sequence is not optional in practice. If your item must render in a stable place, assign it.

## User-menu items are not components

The `user_menuitems` registry expects a factory that returns an object with keys like:

- `description`
- optional `href`
- `callback`
- optional `hide`
- optional `sequence`

That is different from `systray`, which uses component descriptors.

## Registry events exist, but are rarely the first tool

Registries are event buses and emit `UPDATE`. Use that only when you are truly building infrastructure around dynamic registry contents. For ordinary addon code, just register once at module load.

## Practical rule

When you need to extend Odoo frontend behavior, ask in this order:

1. Is there a registry for this?
2. If not, is there a service hook or component prop for it?
3. Patch only if both answers are no.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/frontend/registries.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/framework_overview.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/javascript_reference.html
