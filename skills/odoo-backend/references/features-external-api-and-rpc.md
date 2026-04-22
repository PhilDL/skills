---
name: features-external-api-and-rpc
description: The Odoo 19 external API surface: prefer JSON-2 with bearer API keys, understand per-call transactions, and migrate legacy XML-RPC or JSON-RPC `execute_kw` integrations safely.
---

# External API and RPC

For new Odoo 19 integrations, prefer JSON-2. The older XML-RPC and JSON-RPC APIs still exist, but Odoo's 19.0 docs mark them deprecated and scheduled for removal in Odoo 22 (fall 2028).

## JSON-2 is the default for new integrations

Endpoint shape:

```text
POST /json/2/<model>/<method>
```

Headers that matter:

- `Authorization: bearer <api_key>`
- `Content-Type: application/json`
- `X-Odoo-Database: <db_name>` when the host serves multiple databases
- `User-Agent: <your integration>`

Body shape:

- `ids`: optional record IDs for record methods
- `context`: optional context object
- other method parameters by name

## Minimal JSON-2 example

```python
import requests

BASE_URL = "https://mycompany.example.com/json/2"
headers = {
    "Authorization": f"bearer {API_KEY}",
    "X-Odoo-Database": "mycompany",
    "Content-Type": "application/json",
}

response = requests.post(
    f"{BASE_URL}/res.partner/search_read",
    headers=headers,
    json={
        "context": {"lang": "en_US"},
        "domain": [["is_company", "=", True]],
        "fields": ["name", "country_id"],
        "limit": 10,
    },
)
response.raise_for_status()
partners = response.json()
```

## JSON-2 transaction rule

Each JSON-2 call runs in its own SQL transaction.

Implication:

- do not split one logical business operation across multiple calls if consistency matters
- prefer one server-side method that performs the whole action atomically

This is the same reason `search_read` is safer than a separate `search` followed by `read` in concurrent systems.

## Use dedicated bot users for long-lived integrations

The external API docs recommend:

- personal accounts for one-off interactive work
- dedicated bot users for automated integrations

That keeps permissions minimal and makes audit trails clearer because log-access fields reflect the bot account.

## Dynamic API discovery

The JSON-2 docs mention the database-local `/doc` page as the place to inspect models, fields, and available methods for the current database.

## Legacy XML-RPC / JSON-RPC

The classic object-service pattern is still:

```python
uid = common.authenticate(db, username, password, {})
models.execute_kw(
    db,
    uid,
    password,
    "res.partner",
    "search_read",
    [[["is_company", "=", True]]],
    {"fields": ["name"], "limit": 5},
)
```

Keep it only for existing integrations you are maintaining.

## Migration map

- `version()` -> `GET /web/version`
- `login()` / `authenticate()` -> bearer API key auth
- object-service `execute_kw(...)` -> `POST /json/2/<model>/<method>`
- keep custom `@route(type="jsonrpc")` endpoints only when you truly need custom controllers; they are not part of the RPC deprecation notice

## Pick fields explicitly

Whether you use JSON-2 or legacy RPC, avoid broad `read()` calls without `fields=`. The older RPC docs show how large those payloads can get on common models.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/external_api.html
- https://www.odoo.com/documentation/19.0/developer/reference/external_rpc_api.html
