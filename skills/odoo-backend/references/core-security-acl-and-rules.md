---
name: core-security-acl-and-rules
description: ACLs, record rules, field-level access, and the security pitfalls that routinely leak data or break access control in Odoo backend code.
---

# Security, ACL, and Rules

Odoo backend security is not one switch. Model CRUD, row-level access, and field visibility are separate layers, and custom Python code can bypass all three if written carelessly.

## Security layers

### Groups

Users belong to `res.groups`. Security configuration attaches to groups, not directly to users.

### ACLs grant model-level CRUD

ACLs are additive. A user's effective model access is the union of all ACLs granted through their groups.

Typical ACL CSV:

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_business_trip_user,business.trip user,model_business_trip,base.group_user,1,1,1,0
access_business_trip_manager,business.trip manager,model_business_trip,my_module.group_trip_manager,1,1,1,1
```

### Record rules filter rows

Rules apply record-by-record after ACLs.

```xml
<record id="business_trip_rule_owner" model="ir.rule">
    <field name="name">Business Trip: owner only</field>
    <field name="model_id" ref="model_business_trip"/>
    <field name="domain_force">[('user_id', '=', user.id)]</field>
    <field name="groups" eval="[(4, ref('base.group_user'))]"/>
</record>
```

Important composition rules from the docs:

- global rules intersect
- group rules unify
- global and group rule sets intersect

This is why multiple global rules are dangerous: they can accidentally intersect down to zero records.

### Field access strips field visibility

```python
secret_amount = fields.Float(groups="my_module.group_trip_manager")
```

If a user is not in one of the declared groups:

- the field is removed from views
- `fields_get()` omits it
- explicit read/write attempts error out

## Public methods are part of the attack surface

The security docs are explicit: any public model method can be executed via RPC with chosen parameters.

Treat these as public API:

- button methods
- methods called from controllers
- methods reachable over external APIs or `call_kw`

Pattern:

```python
from odoo import api, models
from odoo.exceptions import AccessError


class BusinessTrip(models.Model):
    _name = "business.trip"

    def action_confirm(self):
        self.ensure_one()
        if not self.env.user.has_group("my_module.group_trip_manager"):
            raise AccessError("Only trip managers can confirm trips.")
        return self._confirm_trip()

    @api.private
    def _confirm_trip(self):
        self.write({"state": "confirmed"})
```

## Avoid bypassing the ORM unless you must

Raw cursor access skips:

- access rights
- record rules
- field invalidation
- active/inactive semantics
- translation helpers

If ORM can express the query, use ORM first.

## Never interpolate SQL by hand

Bad:

```python
self.env.cr.execute(
    "SELECT id FROM business_trip WHERE user_id IN (%s)" % ",".join(map(str, ids))
)
```

Better:

```python
from odoo.tools import SQL

self.env.cr.execute(
    SQL("SELECT id FROM business_trip WHERE user_id IN %s"),
    [tuple(ids)],
)
```

## Build domains safely

Do not append user-supplied list fragments directly to raw domain lists. Use `Domain(...)` composition instead.

```python
from odoo.fields import Domain

user_domain = Domain(self.filter_domain)
secure_domain = user_domain & Domain("user_id", "=", self.env.uid)
records = self.search(secure_domain)
```

## `safe_eval` is still privileged execution

From the docs:

- never use `eval(...)` on user data
- `safe_eval(...)` is safer than `eval`, but still reserved for trusted, privileged use
- if you are parsing data, use typed parsers instead

Prefer:

- `json.loads(...)`
- `ast.literal_eval(...)`
- `int(...)`, `float(...)`

## Escape before mixing text into HTML

Use escaping for text, sanitizing for untrusted code/HTML.

```python
from markupsafe import Markup, escape

message = Markup("<strong>%s</strong>") % escape(record.name)
```

Good rules:

- never trust `t-raw` with evolving content
- keep HTML structure separate from data
- treat `Markup` objects as code, plain strings as text

## Dynamic field access: use `record[field_name]`

Avoid `getattr(record, field_name)` or `setattr(...)` for user-provided field names. The recordset `__getitem__` path stays inside field access semantics and avoids arbitrary attribute access.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/backend/security.html
- https://www.odoo.com/documentation/19.0/developer/reference/backend/orm.html
- https://www.odoo.com/documentation/19.0/developer/reference/external_api.html
