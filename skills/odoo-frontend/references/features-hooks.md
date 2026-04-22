---
name: features-hooks
description: Odoo-provided Owl hooks for assets, autofocus, event buses, control-panel paging, element positioning, and spellcheck behavior.
---

# Hooks

This file is only about Odoo's frontend hooks. For Owl lifecycle, `useState`, props, refs, slots, and general hook semantics, use [owl](../../owl/SKILL.md).

## Hook map

| Hook | Import | Use it for |
| --- | --- | --- |
| `useAssets` | `@web/core/assets` | load JS or CSS lazily during component startup |
| `useAutofocus` | `@web/core/utils/hooks` | focus the first `t-ref="autofocus"` element when it appears |
| `useBus` | `@web/core/utils/hooks` | subscribe to an event bus with automatic cleanup |
| `usePager` | `@web/search/pager_hook` | drive the control-panel pager from component state |
| `usePosition` | `@web/core/position_hook` | keep a popper aligned to a reference element |
| `useSpellCheck` | `@web/core/utils/hooks` | enable spellcheck on focus for inputs, textareas, or contenteditable nodes |

## `useBus` is the safest way to listen to app events

```js
import { Component } from "@odoo/owl";
import { useBus } from "@web/core/utils/hooks";

class RouteWatcher extends Component {
  setup() {
    useBus(this.env.bus, "ROUTE_CHANGE", () => {
      this.syncFromRoute();
    });
  }
}
```

Use it instead of manual `on`/`off` bookkeeping.

## `usePager` is the control-panel integration point

```js
import { Component, useState } from "@odoo/owl";
import { usePager } from "@web/search/pager_hook";

class CustomViewController extends Component {
  setup() {
    this.state = useState({ offset: 0, limit: 80, total: 250 });

    usePager(() => ({
      offset: this.state.offset,
      limit: this.state.limit,
      total: this.state.total,
      onUpdate: (next) => Object.assign(this.state, next),
    }));
  }
}
```

If the pager belongs in the control panel, this is the hook to use.

## `usePosition` expects a popper ref

That is the non-obvious part. The positioned element must be exposed with `t-ref`, and the hook tracks resize and scroll automatically.

```js
import { Component, useRef, xml } from "@odoo/owl";
import { usePosition } from "@web/core/position_hook";

class Popover extends Component {
  static template = xml`
    <button t-ref="toggler">Toggle</button>
    <div t-ref="menu">Menu</div>
  `;

  setup() {
    const toggler = useRef("toggler");
    usePosition(() => toggler.el, { popper: "menu", position: "bottom-start" });
  }
}
```

## `useSpellCheck` is opt-in, not a global contenteditable policy

The hook enables spellcheck on focus, then clears it on blur. It supports:

- the default `t-ref="spellcheck"`
- a custom `refName`
- a container with nested editable content

Set `spellcheck="false"` explicitly on elements you do not want auto-enabled.

## `useAssets` pairs with bundle hygiene

Use it only for truly on-demand assets, not as a replacement for manifest bundles. If the code is needed on every page load, keep it in the bundle.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/frontend/hooks.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/assets.html
