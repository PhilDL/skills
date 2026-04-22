---
name: features-editor-and-mobile
description: Odoo Editor Powerbox customization and the mobile bridge APIs exposed from Odoo Web.
---

# Editor and Mobile

These are specialized frontend surfaces. Load this reference only when the task actually touches the rich-text editor or the native mobile bridge.

## Powerbox: extend the editor's existing instance

The key rule from the docs is strict: never instantiate Powerbox yourself. The editor owns one instance already.

When you need to customize commands or categories, modify the options before the editor is created, or call `open(...)` on the current editor's powerbox.

## Add commands by extending editor options

The docs show this pattern on top of `Wysiwyg` option building:

```js
_getPowerboxOptions() {
  const options = this._super();
  options.categories.push({
    name: _t("Documentation"),
    priority: 300,
  });
  options.commands.push({
    name: _t("Document"),
    category: _t("Documentation"),
    description: _t("Add this text to your mailing's documentation"),
    fontawesome: "fa-book",
    priority: 1,
  });
  return options;
}
```

Practical rules:

- wrap user-visible strings in `_t(...)`;
- use meaningful priority values, not random large integers;
- work through the editor's own powerbox instance.

## Open a fully custom Powerbox only for contextual flows

If you need a temporary command set, call:

```js
this.odooEditor.powerbox.open(commands, categories);
```

That bypasses the default catalog for the current interaction.

## Mobile bridge: only available inside the Odoo mobile app

The mobile docs describe a bridge exposed through `web_mobile.rpc`. It is for enterprise mobile-app contexts, not ordinary desktop or browser tabs.

Supported method families include:

- `showToast`
- `vibrate`
- `showSnackBar`
- `showNotification`
- `addContact`
- `scanBarcode`
- `switchAccount`

Each method on the `mobile` bridge object returned by `web_mobile.rpc` returns a jQuery Deferred.

```js
mobile.methods.showSnackBar({
  message: "Message deleted",
  btn_text: "Undo",
}).then((confirmed) => {
  if (confirmed) {
    this.undoDelete();
  }
});
```

## Barcode scanning is the highest-value mobile API

The docs position `scanBarcode()` as a real-time scanner that supports standard 1D and 2D formats. Use it when the feature goal is operational scanning, not camera customization.

## Sources

- https://www.odoo.com/documentation/19.0/developer/reference/frontend/odoo_editor.html
- https://www.odoo.com/documentation/19.0/developer/reference/frontend/mobile.html
