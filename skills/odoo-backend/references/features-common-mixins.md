---
name: features-common-mixins
description: The common backend mixins worth reusing before you invent custom plumbing: chatter, aliases, activities, UTM tracking, website publication/SEO, and ratings.
---

# Common Mixins

Before building custom messaging, aliasing, activity, or publication logic, check whether Odoo already ships the mixin. The backend docs cover a few mixins that save a lot of repeated code.

## `mail.thread`

Use it for chatter, followers, message posting, and field tracking.

```python
from odoo import fields, models


class BusinessTrip(models.Model):
    _name = "business.trip"
    _inherit = ["mail.thread"]

    name = fields.Char(tracking=True)
    partner_id = fields.Many2one("res.partner", tracking=True)
```

Form view:

```xml
<chatter open_attachments="True"/>
```

Useful server-side methods from the docs:

- `message_post(...)`
- `message_post_with_template(...)`
- `message_subscribe(...)`
- `message_unsubscribe(...)`
- `message_new(...)`
- `message_update(...)`

## Field tracking and custom subtypes

Use `tracking=True` on fields, and override `_track_subtype(...)` when specific transitions should emit specific subtype notifications.

## `mail.alias.mixin`

Use it when a parent record should own an inbound email alias that creates child records.

Required overrides:

- `_get_alias_model_name(vals)`
- `_get_alias_values()`

That is the supported route for patterns like "email this project address to create a task".

## `mail.activity.mixin`

Use it when records need scheduled follow-up work inside chatter.

```python
class BusinessTrip(models.Model):
    _name = "business.trip"
    _inherit = ["mail.thread", "mail.activity.mixin"]
```

This enables activity widgets and common activity flows without custom tables.

## `utm.mixin`

Use it when website-created records should capture campaign/source/medium from tracked URLs and cookies.

Fields added:

- `campaign_id`
- `source_id`
- `medium_id`

## `website.published.mixin`

Use it when backend records have a frontend page and need a publication toggle plus URL.

Fields added:

- `website_published`
- `website_url` (computed; you must implement it)

## `website.seo.metadata`

Adds SEO metadata fields:

- `website_meta_title`
- `website_meta_description`
- `website_meta_keywords`

## `rating.mixin`

Use when the model needs customer rating requests or rating aggregation instead of custom satisfaction plumbing.

## Source-backed rule of thumb

If the desired behavior is already modeled as chatter, aliasing, activities, tracking, or publication, prefer inheriting the mixin to inventing new tables and controllers.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/backend/mixins.html
