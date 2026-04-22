---
name: core-module-structure-and-data
description: Manifest fields, recommended module layout, XML/CSV loading rules, and the practical meaning of `record`, `field`, `function`, `delete`, `noupdate`, and data-file ordering.
---

# Module Structure and Data Files

Most Odoo backend work starts with two things: a module package and ordered data loading. If the manifest order is wrong or a record lacks a stable external ID, later inheritance and updates get brittle fast.

## Minimal module skeleton

```text
my_module/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   └── my_model.py
├── security/
│   ├── ir.model.access.csv
│   └── my_rules.xml
├── data/
│   └── my_data.xml
├── views/
│   └── my_views.xml
├── report/
│   ├── my_report.xml
│   └── my_report_templates.xml
└── demo/
    └── demo.xml
```

## Manifest fields that matter most

```python
{
    "name": "My Module",
    "version": "1.0",
    "depends": ["base", "mail"],
    "data": [
        "security/ir.model.access.csv",
        "security/my_rules.xml",
        "data/my_data.xml",
        "views/my_views.xml",
        "report/my_report.xml",
    ],
    "demo": ["demo/demo.xml"],
    "assets": {
        "web.assets_backend": [
            "my_module/static/src/js/my_file.js",
        ],
    },
    "application": False,
    "license": "LGPL-3",
}
```

High-signal fields:

- `depends`: module load graph. Always list what you extend or rely on.
- `data`: files loaded on install and update.
- `demo`: demo-only data.
- `auto_install`: useful for link/integration modules.
- `external_dependencies`: declare Python or binary requirements.
- `{pre_init, post_init, uninstall}_hook`: only when ORM/data files cannot reasonably do the job.
- `assets`: static bundle wiring, even for backend-oriented addons that include reports or tours.

## Data files are sequential

The XML loader executes operations in order. Later operations can refer to earlier results, not the other way around.

That makes stable external IDs non-optional for anything you may update, inherit, or reference later.

## `noupdate` changes upgrade behavior

```xml
<odoo>
    <data noupdate="1">
        <record id="my_rule" model="ir.rule">
            <field name="name">My Rule</field>
        </record>
    </data>

    <record id="my_server_action" model="ir.actions.server">
        <field name="name">Always reloaded on update</field>
    </record>
</odoo>
```

- `noupdate="1"` means install once, then preserve manual edits on module updates.
- Plain operations outside `noupdate` reload during install and update.

Use `noupdate` for seed data that administrators are expected to tweak. Do not hide essential structural changes inside it unless you are ready to manage upgrades manually.

## Core XML operations

### Create or update records

```xml
<record id="business_trip_form" model="ir.ui.view">
    <field name="name">business.trip.form</field>
    <field name="model">business.trip</field>
    <field name="arch" type="xml">
        <form string="Business Trip">
            <field name="name"/>
        </form>
    </field>
</record>
```

Useful `field` value modes:

- body text: direct literal value
- `ref="module.xmlid"`: relational references
- `search="[(...)]"`: resolve relation by domain
- `eval="..."`: last resort for Python expressions
- `type="xml"` / `type="html"` / `type="int"` / `type="float"` / `type="base64"`: explicit conversions

### Delete records

```xml
<delete model="ir.ui.view" id="my_module.legacy_view"/>
```

or by domain:

```xml
<delete model="mail.template" search="[('name', '=', 'Old template')]"/>
```

### Call model methods from data

```xml
<function model="res.partner" name="send_inscription_notice"
    eval="[[ref('partner_1'), ref('partner_2')]]"/>
```

Reserve `function` for setup flows that really belong to server code. If static records are enough, prefer declarative data.

## Shortcut tags worth knowing

- `menuitem`: shorter `ir.ui.menu` definition
- `template`: shorter `ir.ui.view` definition for QWeb templates
- `asset`: shorter `ir.asset` definition

## CSV is for bulk simple records

Use CSV when records are repetitive and flat. ACLs are the canonical example.

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_business_trip_user,business.trip user,model_business_trip,base.group_user,1,1,1,0
```

## Practical loading order

This is a pragmatic pattern rather than a rule from one specific page:

1. `security/ir.model.access.csv`
2. security XML such as groups and rules
3. base data your views/actions depend on
4. views, menus, actions
5. reports
6. demo data

That ordering keeps references resolvable and avoids menus or actions pointing at missing security or views.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/backend/module.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/data.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/actions.html
