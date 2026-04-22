---
name: features-qweb-templates
description: Classical QWeb directives, safe output, inheritance, debugging hooks, and the JS-side `core.qweb` renderer.
---

# QWeb Templates

This file is for classical QWeb and JS-side QWeb inheritance, not Owl template behavior. For Owl template directives and component templates, use [owl](../../owl/SKILL.md).

## Core directives to remember

- `t-out`: escaped output by default
- `t-if`, `t-elif`, `t-else`
- `t-foreach` + `t-as`
- `t-att-*`, `t-attf-*`, `t-att`
- `t-set`
- `t-call`

Minimal example:

```xml
<t t-set="title" t-value="'Partners'"/>
<div t-if="records.length">
  <h1><t t-out="title"/></h1>
  <ul>
    <li t-foreach="records" t-as="record">
      <t t-out="record.name"/>
    </li>
  </ul>
</div>
```

## Safe output rules

`t-out` escapes by default. In JS, if some content is marked safe but must be escaped again, convert it back to a plain string with `String(content)`.

Avoid reviving deprecated `t-raw` usage in new code.

## JS-side templates live at top level

In JavaScript template files, `t-name` must be defined on top-level templates:

```xml
<templates>
  <t t-name="my_addon.some_template">
    <div>...</div>
  </t>
</templates>
```

## Prefer `t-inherit` over deprecated `t-extend`

Primary inheritance creates a child template:

```xml
<t t-name="child.template" t-inherit="base.template" t-inherit-mode="primary">
  <xpath expr="//ul" position="inside">
    <li>new element</li>
  </xpath>
</t>
```

Extension inheritance patches in place:

```xml
<t t-inherit="base.template" t-inherit-mode="extension">
  <xpath expr="//tr[1]" position="after">
    <tr><td>new cell</td></tr>
  </xpath>
</t>
```

The old `t-extend` plus `t-jquery` mechanism is deprecated and harder to maintain.

## The JS debugging hooks are practical

- `t-log="expr"`: logs during rendering
- `t-debug=""`: triggers a debugger breakpoint
- `t-js="ctx"`: executes JavaScript with the rendering context

Use them only while debugging or in narrowly controlled diagnostic templates.

## `core.qweb` is the shared JS renderer

Odoo exposes a loaded `QWeb2.Engine` instance as `core.qweb`, and `core.qweb.render(...)` can render named templates into strings. That is mainly useful for lower-level template work and legacy integration points.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/frontend/qweb.html
