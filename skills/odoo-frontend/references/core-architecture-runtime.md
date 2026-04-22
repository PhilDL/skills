---
name: core-architecture-runtime
description: Web-client architecture, environment, contexts, Python-expression helpers, domains, event bus, browser facade, debug modes, and client actions.
---

# Architecture Runtime

Use this reference when the task needs the Odoo web-client mental model, not a single widget or view detail.

## Start with the web client shape

The Odoo web client is a single-page Owl application. The top-level template is effectively:

```xml
<t t-name="web.WebClient">
  <body class="o_web_client">
    <NavBar/>
    <ActionContainer/>
    <MainComponentsContainer/>
  </body>
</t>
```

Three consequences matter in practice:

- `ActionContainer` is where client actions and `act_window` controllers are mounted.
- `MainComponentsContainer` renders whatever is registered in `registry.category("main_components")`.
- Most extension work is about plugging into services, registries, or actions rather than replacing the root app.

## Keep these runtime objects in working memory

- `this.env.services`: all started services. In components, prefer `useService(...)`.
- `this.env.bus`: global Owl `EventBus` for app-wide coordination.
- `this.env._t`: translation function for JavaScript strings.
- `this.env.debug`: empty string when debug is off, otherwise a mode string like `assets` or `assets,tests`.
- `this.env.isSmall`: true when Odoo is in mobile layout.

## Reach for context deliberately

Odoo has two different contexts in frontend code:

- User context: available from the `user` service, automatically injected by `orm` requests.
- Action context: the `context` field of `ir.actions.client` or `ir.actions.act_window`, plus any `additional_context` you pass to `doAction(...)`.

Use `additional_context` when one action needs to feed defaults or search state into the next action:

```js
import { Component } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

class OpenPeriodAction extends Component {
  setup() {
    this.action = useService("action");
  }

  open(defaultPeriodId) {
    return this.action.doAction("my_module.some_action", {
      additional_context: {
        default_period_id: defaultPeriodId,
      },
    });
  }
}
```

## Use the built-in Python-expression helpers instead of inventing your own parser

Odoo evaluates many frontend expressions with its small Python interpreter.

```js
import { evaluateExpr } from "@web/core/py_js/py";
import { Domain } from "@web/core/domain";

const visible = evaluateExpr("state == 'draft' and amount_total > 0", {
  state: "draft",
  amount_total: 10,
});

const domain = Domain.and([
  [["is_company", "=", true]],
  "[('customer_rank', '>', 0)]",
]).toList();
```

Use:

- `evaluateExpr(...)` for frontend evaluation of Python-style modifiers or options.
- `Domain` for combining, normalizing, or serializing domains without hand-building prefix arrays.

## Prefer the bus and browser facades over ad hoc globals

High-value bus events from the docs include:

- `ROUTE_CHANGE`
- `RPC:REQUEST`
- `RPC:RESPONSE`
- `WEB_CLIENT_READY`
- `CLEAR-CACHES`

And for browser APIs, prefer `@web/core/browser/browser` in code that may need tests:

```js
import { browser } from "@web/core/browser/browser";

browser.setTimeout(() => {
  browser.console.log("tick");
}, 1000);
```

That indirection makes frontend code easier to mock in tests.

## Client actions are just action-registry entries plus a server record

Register the Owl component under the action tag:

```js
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";

class MyDashboard extends Component {}
MyDashboard.template = "my_module.MyDashboard";

registry.category("actions").add("my_module.dashboard", MyDashboard);
```

Then expose it from Python/XML:

```xml
<record id="my_dashboard_action" model="ir.actions.client">
  <field name="name">Dashboard</field>
  <field name="tag">my_module.dashboard</field>
</record>
```

## Debug modes change what the frontend can see

- `debug=assets`: unminified bundles and source maps.
- `debug=tests`: injects the tests bundle so tours and test-only assets exist.

When debugging frontend code, `debug=assets` is the baseline.

## Use the right companion skill

- For Owl component semantics, switch to [owl](../../owl/SKILL.md).
- For view architecture, arch parsing, and widgets, switch to [view-architecture](./view-architecture.md), [arch-xml](./arch-xml.md), [field-widgets](./field-widgets.md), and [view-widgets](./view-widgets.md).

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/frontend/framework_overview.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/javascript_reference.html
