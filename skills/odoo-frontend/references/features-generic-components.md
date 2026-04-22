---
name: features-generic-components
description: Odoo-specific component conventions plus the reusable frontend component palette provided by the web framework.
---

# Generic Components

Use this reference for Odoo's built-in UI components, not Owl fundamentals. For lifecycle, reactivity, props, slots, and render performance, use [owl](../../owl/SKILL.md).

## Odoo component conventions still matter

For production Odoo components:

- use `setup()`, not `constructor()`;
- keep templates in XML files so they are translatable;
- name templates `addon_name.ComponentName`;
- co-locate `.js`, `.xml`, and optional `.scss`;
- load those files through assets bundles.

Minimal shape:

```js
import { Component } from "@odoo/owl";

export class MyComponent extends Component {}
MyComponent.template = "my_addon.MyComponent";
```

## The generic component palette

### `ActionSwiper`

Import: `@web/core/action_swiper/action_swiper`

Use when a list or message row needs mobile-style swipe actions. The docs call out record and message interactions as the main fit.

### `CheckBox`

Import: `@web/core/checkbox/checkbox`

Use for a labelled checkbox when clicking the label should toggle the value too.

```xml
<CheckBox value="state.enabled" disabled="props.readonly" t-on-change="onToggle">
  Enable automation
</CheckBox>
```

### `ColorList`

Import: `@web/core/colorlist/colorlist`

Use when users choose from Odoo's predefined color IDs. It supports compact or always-expanded behavior.

### `Dropdown` and `DropdownItem`

Import: `@web/core/dropdown/dropdown` and `@web/core/dropdown/dropdown_item`

Use for complex menus, nested menus, hotkeys, keyboard navigation, and auto-positioned popovers. The key detail is slot structure:

```xml
<Dropdown>
  <button type="button">Actions</button>
  <t t-set-slot="content">
    <DropdownItem onSelected="openRecord">Open</DropdownItem>
    <DropdownItem onSelected="archiveRecord">Archive</DropdownItem>
  </t>
</Dropdown>
```

### `Notebook`

Import: `@web/core/notebook/notebook`

Use for tabbed pages. Pages can be declared with slots or through a `pages` prop. Prefer the prop form when tabs are generated from repeated config.

### `Pager`

Import: `@web/core/pager/pager`

Use for pagination UI outside or inside the control panel. If it belongs in the control panel, pair it with `usePager(...)`.

### `SelectMenu`

Import: `@web/core/select_menu/select_menu`

Use only when native `<select>` is too limited. The docs explicitly recommend the native control first because it is more accessible and works better on mobile.

Good reasons to choose `SelectMenu`:

- searchable options
- grouped choices
- custom option rendering
- multi-select with tags
- custom bottom area actions

### `TagsList`

Import: `@web/core/tags_list/tags_list`

Use to render pills/tags, optionally with delete handlers or a visible-items cap.

## Selection rule of thumb

- Native HTML control if it already fits.
- Odoo generic component if the behavior is common across addons.
- Custom component only when the generic palette is insufficient.

That keeps behavior consistent with the rest of the web client.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/frontend/owl_components.html
