---
name: best-practices-frontend-workflow
description: High-signal review checklist for Odoo frontend work across modules, bundles, services, translations, session data, patching, and tests.
---

# Frontend Workflow

Use this as the final review pass after implementing any non-trivial Odoo frontend change.

## Default implementation order

1. Pick the right bundle and module boundary.
2. Prefer a registry, service, hook, or component prop before patching.
3. Use `orm` for models, `rpc` only for controllers, `http` only for raw HTTP.
4. Keep translatable UI strings in `_t(...)` with a static format string.
5. Add or update tests under `static/tests`.

## The mistakes that waste the most time

- File added to the wrong bundle, then debugged as if the code were wrong.
- Cross-addon relative import instead of `@addon/path`.
- Late patching after instances already exist.
- Using `rpc` for model methods instead of `orm`.
- Adding expensive data to `session_info`, slowing every `/web` load.
- Dynamic `_t(...)` strings that cannot be extracted for translation.
- Using `SelectMenu` where native `<select>` would be simpler and more accessible.
- Expecting hot reload; Odoo still needs refresh and sometimes asset regeneration.
- Swallowing an Owl render error without restoring UI state or re-dispatching the error.

## Cheap pre-ship checklist

- [ ] Bundle choice is intentional: backend, common, frontend, or unit tests.
- [ ] Module header and imports follow Odoo rules.
- [ ] Registry or service extension was preferred over patching.
- [ ] Any patch is top-level, prototype-safe, and constructor-free.
- [ ] New user-visible strings go through `_t(...)`.
- [ ] Session additions are cheap and required during early boot.
- [ ] If URL state changed, router behavior was updated deliberately.
- [ ] If the feature is mobile-only, the code checks that the mobile bridge exists.
- [ ] Tests live in `static/tests` and run from `/web/tests`.

## Choose the narrower skill when needed

- Owl internals: [owl](../../owl/SKILL.md)
- Views and widgets: [view-architecture](./view-architecture.md), [field-widgets](./field-widgets.md), [view-widgets](./view-widgets.md), [best-practices](./best-practices.md)
- Hoot, web helpers, mock server: [odoo-19-javascript-testing](../../odoo-19-javascript-testing/SKILL.md)

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/frontend/framework_overview.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/javascript_reference.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/assets.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/javascript_modules.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/services.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/registries.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/hooks.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/patching_code.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/error_handling.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/odoo_editor.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/unit_testing.html
