---
name: core-services
description: Service lifecycle, `useService`, the key built-in services, and the boundary between `orm`, `rpc`, `http`, notifications, routing, and user data.
---

# Services

Services are the main long-lived frontend building block in Odoo. If code has side effects, shared state, or cross-screen behavior, it usually belongs in a service.

## Service contract

A service can define:

- `dependencies`: names of other services it needs.
- `start(env, deps)`: creates the service value.
- `async`: marks async APIs whose result should be ignored if the calling component is destroyed.

Minimal example:

```js
import { registry } from "@web/core/registry";

const myService = {
  dependencies: ["notification"],
  start(env, { notification }) {
    return {
      ping() {
        notification.add("pong");
      },
    };
  },
};

registry.category("services").add("myService", myService);
```

## In components, use `useService(...)`

That is the supported boundary for component code:

```js
import { Component } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

class Example extends Component {
  setup() {
    this.orm = useService("orm");
    this.action = useService("action");
    this.notification = useService("notification");
  }

  async save() {
    await this.orm.call("res.partner", "write", [[1], { name: "Updated" }]);
    this.notification.add("Partner updated", { type: "success" });
  }
}
```

## Pick the right network layer

- `orm`: call model methods. This is the default for business data.
- `rpc`: call Odoo controllers directly.
- `http`: raw GET/POST when you need lower-level HTTP control.

Do not use `rpc` for model methods unless you are deliberately bypassing the ORM layer.

## The built-in services that matter most

### `notification`

Use it for user feedback from JavaScript. `add(...)` returns a close function and supports buttons.

```js
const close = this.notification.add("You closed a deal!", {
  title: "Congrats",
  type: "success",
  buttons: [
    {
      name: "Open commission",
      onClick: () => this.action.doAction("commission_action"),
      primary: true,
    },
  ],
});
```

### `router`

Use it when the UI state needs to track the URL.

- `router.current`: current `pathname`, `search`, and `hash`.
- `pushState(hash, replace?)`: updates the hash without reloading.
- `redirect(url, wait?)`: full page navigation.

Important: `pushState(...)` only updates the URL. It does not dispatch `ROUTE_CHANGE` by itself.

### `rpc`

Use it for controllers only:

```js
import { rpc } from "@web/core/network/rpc";

const result = await rpc("/my/route", { some: "value" });
```

When an RPC fails:

- the promise rejects;
- Odoo emits `RPC_ERROR` on the main bus;
- network failures trigger a notification and polling until the server responds again.

### `effect`

Use it for graphical overlays such as rainbow-man or custom effects via `registry.category("effects")`.

### `title`

Use `setParts(...)` instead of replacing `document.title` manually:

```js
const title = useService("title");
title.setParts({ odoo: "Odoo 19", action: "Import" });
```

### `user`

Read current-user data from here instead of copying it around:

- `context`
- `lang`
- `tz`
- `userId`
- `isAdmin`
- `isSystem`
- `home_action_id`

It also exposes `updateContext(...)` and `removeFromContext(...)`.

## Services pair naturally with registries

Two high-value service-related registries:

- `registry.category("services")`: activates services at startup.
- `registry.category("effects")`: effect implementations consumed by the `effect` service.

## Testing consequence

The docs explicitly recommend packaging side-effectful code into services because tests can choose which services are active. That is one of the main reasons to move non-component global behavior into a service instead of leaving it at module scope.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/frontend/services.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/framework_overview.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/javascript_reference.html
