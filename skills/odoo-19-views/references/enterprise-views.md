# Odoo 19 Enterprise-Only Views

Gantt, Map, Cohort, Grid. All UNVERIFIED FOR 19.0 from public sources — their code lives in `github.com/odoo/enterprise` which is a private repository.

> **Sibling reference:** for the open-source views (kanban, graph, pivot, calendar, activity, hierarchy, search) see [built-in-views.md](./built-in-views.md). Those are fully verified.
>
> **Cross-version note:** Odoo's enterprise views are stable across 17 → 18 → 19, so the arch attributes below (sourced from 18.0 docs) are very likely still valid. **Always test against the exact 19.0 enterprise version you're targeting** before relying on this in production.

## What this file covers

- What is confirmed about these views in 19.0 from public sources
- The most likely arch attributes based on documentation and cross-version continuity
- Where and how to go look for the truth once you have enterprise repo access

## What IS confirmed in 19.0

All four enterprise types appear in the `ViewType` JSDoc union in `addons/web/static/src/views/view.js` (line 75, public):

```
 * @typedef {"activity"
 *  | "calendar"
 *  | "cohort"
 *  | "form"
 *  | "gantt"
 *  | "graph"
 *  | "grid"
 *  | "hierarchy"
 *  | "kanban"
 *  | "list"
 *  | "map"
 *  | "pivot"
 *  | "search"
 * } ViewType
```

They are NOT in the community `ir.ui.view.type` Selection (only 8 values in community, verified). They are added via `selection_add=[...]` in their respective enterprise addons (`web_gantt`, `web_map`, `web_cohort`, `web_grid`). This is the standard Odoo pattern — the same pattern `web_hierarchy` uses publicly — but the exact enterprise 19.0 code is not auditable from the public repo.

## Gantt (`<gantt>`) — UNVERIFIED FOR 19.0

Expected addon path: `addons/web_gantt/`. Tested: `https://github.com/odoo/odoo/tree/19.0/addons/web_gantt` returns 404.

**Expected descriptor shape** (UNVERIFIED — pattern inferred from public addons like `kanban_view.js`):
```js
export const ganttView = {
    type: "gantt",
    ArchParser: GanttArchParser,
    Controller: GanttController,
    Model: GanttModel,            // custom Model — not RelationalModel
    Renderer: GanttRenderer,
    searchMenuTypes: ["filter", "favorite"],
    // ...
};
registry.category("views").add("gantt", ganttView);
```
Verify in `addons/web_gantt/static/src/gantt_view.js` once you have repo access.

**Most likely root attributes** (from Odoo docs history and cross-version stability):

- `date_start` (**required**, datetime field)
- `date_stop` (**required**, datetime field)
- `default_group_by`
- `string`
- `mode` (day/week/month/year)
- `progress`
- `default_scale`
- `precision`
- `plan` (boolean)
- `color`
- `decoration-<class>="expr"` (like list view decoration modifiers)
- `consolidation`, `consolidation_max`
- `total_row`
- `create`, `edit`, `delete`
- `dynamic_range`
- `display_unavailability`
- `offset`
- `scales`
- `form_view_id`

Child tag: `<field name="…"/>` for tooltip fields and `<templates><t t-name="gantt-popover">…</t></templates>` for custom popovers.

**Minimal probable arch:**
```xml
<gantt date_start="date_start"
       date_stop="date_stop"
       default_group_by="user_id"
       progress="progress"
       default_scale="month"
       color="state">
    <field name="partner_id"/>
    <templates>
        <div t-name="gantt-popover">
            <strong><t t-esc="name"/></strong>
            <div>Assigned to: <t t-esc="user_id"/></div>
        </div>
    </templates>
</gantt>
```

**Verify against enterprise source once accessible.** Do NOT rely on this arch skeleton for production without checking `addons/web_gantt/static/src/gantt_arch_parser.js` in the enterprise 19.0 branch.

## Map (`<map>`) — UNVERIFIED FOR 19.0

Expected addon path: `addons/web_map/`. Tested: 404 on public.

**Most likely root attributes:**

- `res_partner` (**required**, Many2one to `res.partner` used for geocoding)
- `default_order`
- `routing` — `"1"` enables route drawing between pins
- `hide_name`, `hide_address`, `hide_title`
- `panel_title`
- `default_limit`, `limit`

Child tag: `<field name="…" string="…"/>` — each child renders as a line in the pin popup.

**Minimal probable arch:**
```xml
<map res_partner="partner_id" routing="1" hide_address="0">
    <field name="name" string="Task"/>
    <field name="partner_id" string="Client"/>
    <field name="date_deadline" string="Deadline"/>
</map>
```

**Verify against enterprise source.**

## Cohort (`<cohort>`) — UNVERIFIED FOR 19.0

Expected addon path: `addons/web_cohort/`. Tested: 404 on public.

**Most likely root attributes:**

- `date_start` (required)
- `date_stop` (required)
- `string`
- `interval` — `day` | `week` | `month` | `year`
- `mode` — `retention` | `churn`
- `measure`
- `timeline` — `forward` | `backward`

**Minimal probable arch:**
```xml
<cohort string="Subscription retention"
        date_start="create_date"
        date_stop="end_date"
        interval="month"
        mode="retention"
        timeline="forward"/>
```

**Verify against enterprise source.**

## Grid (`<grid>`) — UNVERIFIED FOR 19.0

Expected addon path: `addons/web_grid/`. Tested: 404 on public.

Used by timesheet, attendance, and similar time-grid interfaces.

**Most likely root attributes** (UNVERIFIED — based on 18.0 docs and timesheet usage):

- `string`
- `barchart_total` (boolean)
- `create_inline` (boolean)
- `display_empty` (boolean)
- `adjustment` — `"object"` | `"action"`
- `adjust_name` — method/action name when `adjustment` is set
- One row `<field>` is the row-key; one col `<field type="col"/>` is the column key (typically a date with `interval`); one or more `<field type="measure"/>` are the cell values.

**Minimal probable arch:**
```xml
<grid string="Timesheets" adjustment="object" adjust_name="adjust_grid">
    <field name="project_id" type="row"/>
    <field name="task_id" type="row"/>
    <field name="date" type="col">
        <range name="week" string="Week" span="week" step="day"/>
        <range name="month" string="Month" span="month" step="day"/>
    </field>
    <field name="unit_amount" type="measure" widget="float_time"/>
</grid>
```

**Verify against enterprise source.**

## How to verify

1. If you have access to the enterprise repo, fetch:
   - `https://github.com/odoo/enterprise/tree/19.0/web_gantt/static/src/`
   - `https://github.com/odoo/enterprise/tree/19.0/web_map/static/src/`
   - `https://github.com/odoo/enterprise/tree/19.0/web_cohort/static/src/`
   - `https://github.com/odoo/enterprise/tree/19.0/web_grid/static/src/`

2. Look for `<type>_arch_parser.js` — these files contain the authoritative list of root attributes and child tag handling.

3. Look for `addons/<module>/models/ir_ui_view.py` — the `selection_add` and `_get_view_info` overrides.

4. Inspect the docs page [View architectures (19.0)](https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html) for the formal attribute list (maintained for enterprise by Odoo SA).

## What to do if you can't access enterprise source

- Use the attribute lists above as a starting point for writing an arch, then run the server — the server-side validator will complain about invalid attributes and you can iterate.
- Consider using a `js_class` variant of a community view (like `kanban` or `calendar`) if what you need is a visualization rather than a dependency on enterprise-specific infrastructure.

## Files referenced

- `addons/web/static/src/views/view.js` (public) — `ViewType` JSDoc union.
- `odoo/addons/base/models/ir_ui_view.py` (public) — core `ir.ui.view.type`.
- `https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html` — canonical reference for enterprise arch (documentation, not source).
