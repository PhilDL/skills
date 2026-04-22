---
name: features-actions-and-cron
description: Returned action dictionaries, database-backed Odoo actions, and the correct way to design scheduled jobs with batching and `_commit_progress`.
---

# Actions and Cron

Backend Odoo code often bridges into the client with action dicts, or into background execution with `ir.cron`. Keep those surfaces small, explicit, and batch-friendly.

## Action return values from Python

A method can return:

- `False`: close the current dialog
- string: client-action tag or numeric action identifier
- number: action database ID or external ID
- dict: inline action descriptor

Most backend button flows return a dict.

## Window action pattern

```python
return {
    "type": "ir.actions.act_window",
    "name": "Trips",
    "res_model": "business.trip",
    "views": [[False, "list"], [False, "form"]],
    "domain": [("user_id", "=", self.env.uid)],
    "context": {"search_default_my_trips": 1},
}
```

Key fields:

- `res_model`
- `views`
- `res_id` when opening a specific form record
- `domain`
- `context`
- `target` (`current`, `main`, `new`, `fullscreen`)

## Server actions

Use `ir.actions.server` for declarative or admin-driven automation, not as a replacement for normal Python module code.

States from the docs:

- `code`
- `object_create`
- `object_write`
- `multi`

The `code` state can set an `action` variable that gets returned to the client.

```xml
<record id="trip_server_action" model="ir.actions.server">
    <field name="name">Open Current Trip</field>
    <field name="model_id" ref="model_business_trip"/>
    <field name="state">code</field>
    <field name="code">
if record:
    action = {
        "type": "ir.actions.act_window",
        "res_model": record._name,
        "view_mode": "form",
        "res_id": record.id,
    }
    </field>
</record>
```

Evaluation context includes `model`, `record`, `records`, `env`, `datetime`, `dateutil`, `time`, `timezone`, `log`, and `Warning`.

## Report and client actions

- `ir.actions.report`: binds a QWeb report to a model and print menu
- `ir.actions.client`: hands off to a client-side tag

Keep report template details in the dedicated reports reference; use this file mainly for how actions connect backend logic to those outputs.

## Scheduled actions (`ir.cron`)

Cron jobs should process a batch, commit progress, and return. Do not write infinite loops or self-rescheduling logic.

```python
def _cron_process_ready_trips(self, *, limit=300):
    domain = [("state", "=", "ready")]
    records = self.search(domain, limit=limit)
    records._process_ready_batch()
    remaining = 0 if len(records) < limit else self.search_count(domain)
    self.env["ir.cron"]._commit_progress(len(records), remaining=remaining)
```

Guidance from the docs:

- each call should usually take only a few seconds
- the framework commits after each batch
- the framework will re-call as needed
- do not reschedule the job yourself

## Manual looping inside cron

When you must manage the loop yourself:

```python
def _cron_process_trip_queue(self):
    assert self.env.context.get("cron_id"), "Run only inside cron jobs"
    records = self.search([("state", "=", "ready")])
    self.env["ir.cron"]._commit_progress(remaining=len(records))

    for record in records:
        record = record.try_lock_for_update().filtered_domain([("state", "=", "ready")])
        if not record:
            continue
        try:
            record._process_one()
            if not self.env["ir.cron"]._commit_progress(1):
                break
        except Exception:
            self.env.cr.rollback()
            raise
```

The important pattern is not the exact body. It is:

1. lock
2. re-check domain
3. do bounded work
4. commit progress
5. stop when the scheduler asks you to

## Do not call cron methods directly

The actions docs explicitly say not to call cron functions directly. Use the scheduler or the documented trigger methods when you need to execute them on purpose.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/backend/actions.html
