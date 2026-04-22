---
name: features-qweb-reports
description: QWeb HTML/PDF reports, report actions, translation patterns, paper formats, custom report models, and the asset rules that make report styling actually render.
---

# QWeb Reports

Odoo reports are QWeb templates rendered as HTML or PDF, then optionally converted to PDF by `wkhtmltopdf`. Treat them like server-rendered documents, not like backend views or frontend SPA components.

## Minimal report flow

You need:

1. an `ir.actions.report`
2. a QWeb template whose external ID matches `report_name`

Minimal template:

```xml
<template id="report_business_trip">
    <t t-call="web.html_container">
        <t t-foreach="docs" t-as="o">
            <t t-call="web.external_layout">
                <div class="page">
                    <h2>Business Trip</h2>
                    <p><span t-field="o.name"/></p>
                </div>
            </t>
        </t>
    </t>
</template>
```

## Default template context

Templates get:

- `docs`
- `doc_ids`
- `doc_model`
- `time`
- `user`
- `res_company`
- `website`
- `web_base_url`
- `context_timestamp`

## Report action example

```xml
<record id="action_report_business_trip" model="ir.actions.report">
    <field name="name">Business Trip</field>
    <field name="model">business.trip</field>
    <field name="report_type">qweb-pdf</field>
    <field name="report_name">my_module.report_business_trip</field>
    <field name="binding_model_id" ref="model_business_trip"/>
</record>
```

Useful fields:

- `report_type`: `qweb-pdf` or `qweb-html`
- `paperformat_id`
- `print_report_name`
- `attachment_use`
- `attachment`
- `groups_id`

## Translation pattern

Use a main template plus a translatable sub-template and set `t-lang` on the `t-call`.

```xml
<template id="report_business_trip_main">
    <t t-call="web.html_container">
        <t t-foreach="docs" t-as="doc">
            <t t-call="my_module.report_business_trip_document" t-lang="doc.partner_id.lang"/>
        </t>
    </t>
</template>
```

If you need translatable fields, re-browse in the target language inside the translatable template:

```xml
<t t-set="doc" t-value="doc.with_context(lang=doc.partner_id.lang)"/>
```

Do not re-browse in another language if you do not need translated fields. The docs call out the performance cost explicitly.

## Custom report models

For anything beyond the default `docs` context, define:

```python
from odoo import models


class ReportBusinessTrip(models.AbstractModel):
    _name = "report.my_module.report_business_trip"

    def _get_report_values(self, docids, data=None):
        docs = self.env["business.trip"].browse(docids)
        return {
            "doc_ids": docids,
            "doc_model": "business.trip",
            "docs": docs,
            "lines": docs.mapped("expense_ids"),
        }
```

Important: once you customize `_get_report_values`, the default `doc_ids` / `doc_model` / `docs` are not injected automatically. Add them yourself if the template expects them.

## Paper formats

Use `report.paperformat` when the default company format is wrong:

```xml
<record id="paperformat_trip_badge" model="report.paperformat">
    <field name="name">Trip Badge</field>
    <field name="format">custom</field>
    <field name="page_height">80</field>
    <field name="page_width">100</field>
    <field name="orientation">Portrait</field>
</record>
```

## Report assets and fonts

Custom fonts must be loaded through `web.report_assets_common`, not `web.assets_backend` or `web.assets_common`.

```xml
<template id="report_assets_common_custom_fonts" inherit_id="web.report_assets_common">
    <xpath expr="." position="inside">
        <link href="/my_module/static/src/less/fonts.less" rel="stylesheet" type="text/less"/>
    </xpath>
</template>
```

## Reports are URL-addressable

- `/report/html/<report_name>/<id>`
- `/report/pdf/<report_name>/<id>`

That is useful for debugging the rendered HTML separately from the PDF conversion step.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/backend/reports.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/actions.html
