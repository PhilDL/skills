# Custom View Tutorial — Building a Gallery View

How to build a brand-new view type from scratch in Odoo 19.

## Provenance and caveats

The Odoo 18 documentation contained a 14-step tutorial titled "Master the Odoo web framework → Chapter 3: Create a Gallery View". In Odoo 19 this tutorial page has been **removed from the docs index**:

- 19.0 docs index (`https://www.odoo.com/documentation/19.0/developer/tutorials.html`) — lists only `discover_js_framework` (2 chapters). No master-web-framework chapters.
- 18.0 walkthrough still at `https://www.odoo.com/documentation/18.0/developer/tutorials/master_odoo_web_framework/02_create_gallery_view.html`.

However:
- The starter module `awesome_gallery` is **present on the 19.0 branch** of `odoo/tutorials`. Source: `https://github.com/odoo/tutorials/tree/19.0/awesome_gallery`. The Python side (`ir_ui_view.py`, `ir_action.py`, `views.xml`) is directly usable with Odoo 19.
- Every API the walkthrough uses (`webSearchRead`, `KeepLast`, `visitXML`, `useTooltip`, `FileUploader`, `Layout`, `registry.category("views")`) is still present in Odoo 19 source.

**How to read this file:** Step-by-step text comes from the 18.0 tutorial and the 19.0 starter module. Each step is annotated `[STARTER: 19.0]` (present in the 19.0 starter code), `[TUTORIAL TEXT: 18.0]` (walkthrough source is 18.0 docs), or `[APIS VERIFIED: 19.0]` (the APIs referenced are confirmed in 19.0 source).

## The starter module (`awesome_gallery` @ 19.0)

### File layout
```
awesome_gallery/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   ├── ir_action.py
│   └── ir_ui_view.py
└── views/
    └── views.xml
```

**Not seeded** — the student writes these:
```
awesome_gallery/static/src/
├── gallery_view.js
├── gallery_controller.js
├── gallery_controller.xml
├── gallery_arch_parser.js    (added in step 3)
├── gallery_model.js          (added in step 6)
├── gallery_renderer.js       (added in step 6)
└── gallery_renderer.xml      (added in step 6)
```

### `__manifest__.py` [STARTER: 19.0]
```python
{
    'name': "Gallery View",
    'summary': """
        Starting module for "Master the Odoo web framework, chapter 3: Create a Gallery View"
    """,
    'version': '0.1',
    'application': True,
    'category': 'Tutorials',
    'installable': True,
    'depends': ['web', 'contacts'],
    'data': [
        'views/views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'awesome_gallery/static/src/**/*',
        ],
    },
    'author': 'Odoo S.A.',
    'license': 'AGPL-3'
}
```

### `models/ir_ui_view.py` [STARTER: 19.0]
```python
from odoo import fields, models

class View(models.Model):
    _inherit = 'ir.ui.view'
    type = fields.Selection(selection_add=[('gallery', "Awesome Gallery")])
```

### `models/ir_action.py` [STARTER: 19.0]
```python
from odoo import fields, models

class ActWindowView(models.Model):
    _inherit = 'ir.actions.act_window.view'

    view_mode = fields.Selection(
        selection_add=[('gallery', "Awesome Gallery")],
        ondelete={'gallery': 'cascade'},
    )
```

### `views/views.xml` [STARTER: 19.0]
```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
<data>
    <record id="contacts.action_contacts" model="ir.actions.act_window">
        <field name="name">Contacts</field>
        <field name="res_model">res.partner</field>
        <field name="view_mode">kanban,tree,form,activity</field>
        <field name="search_view_id" ref="base.view_res_partner_filter"/>
        <field name="context">{'default_is_company': True}</field>
        <field name="help" type="html">
            <p class="o_view_nocontent_smiling_face">Create a new contact</p>
        </field>
    </record>
</data>
</odoo>
```

(You'll add `gallery` to `view_mode` later.)

### Missing in 19.0: `_get_view_info` override

The starter does NOT override `_get_view_info`. In 19.0 the JS registry validator requires the type to be in `session.view_info`, so you MUST add this to `models/ir_ui_view.py`:

```python
def _get_view_info(self):
    return {'gallery': {'icon': 'fa fa-th-large'}} | super()._get_view_info()
```

Without this override the JS view switcher won't see the type.

---

## Step 1 — Hello world view [TUTORIAL TEXT: 18.0, APIS VERIFIED: 19.0]

> **Mandatory in 19.0:** before this step works, you MUST add the `_get_view_info` override shown above (in "Missing in 19.0"). Without it the JS view switcher silently won't see the type, and the validator at `view.js:91` rejects `descr.type` as not in `session.view_info`. This is the single most common reason "my new view doesn't appear in the switcher".

### `static/src/gallery_controller.js`
```js
import { Component } from "@odoo/owl";

export class GalleryController extends Component {
    static template = "awesome_gallery.GalleryController";
    static props = ["*"];
    setup() {
        console.log("Gallery controller setup");
    }
}
```

### `static/src/gallery_controller.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<templates xml:space="preserve">
    <t t-name="awesome_gallery.GalleryController">
        <div>Hello from gallery view</div>
    </t>
</templates>
```

### `static/src/gallery_view.js`
```js
import { registry } from "@web/core/registry";
import { GalleryController } from "./gallery_controller";

export const galleryView = {
    type: "gallery",
    display_name: "Gallery",
    icon: "fa fa-th-large",
    multiRecord: true,
    Controller: GalleryController,
};

registry.category("views").add("gallery", galleryView);
```

And update the XML to add `gallery` as a view_mode:
```xml
<field name="view_mode">kanban,tree,form,activity,gallery</field>
```

Also add the arch record for the gallery view:
```xml
<record id="contacts_gallery_view" model="ir.ui.view">
    <field name="name">res.partner.gallery</field>
    <field name="model">res.partner</field>
    <field name="type">gallery</field>
    <field name="arch" type="xml">
        <gallery image_field="image_1920"/>
    </field>
</record>
```

## Step 2 — Use the Layout component [TUTORIAL TEXT: 18.0, APIS VERIFIED: 19.0]

### `gallery_controller.js`
```js
import { Component } from "@odoo/owl";
import { Layout } from "@web/search/layout";

export class GalleryController extends Component {
    static template = "awesome_gallery.GalleryController";
    static components = { Layout };
    static props = ["*"];
}
```

### `gallery_controller.xml`
```xml
<t t-name="awesome_gallery.GalleryController">
    <Layout className="'o_gallery_view'" display="props.display">
        <div class="p-3">Hello from gallery view</div>
    </Layout>
</t>
```

## Step 3 — Parse the arch [TUTORIAL TEXT: 18.0, APIS VERIFIED: 19.0]

Create `static/src/gallery_arch_parser.js`:
```js
export class GalleryArchParser {
    parse(xmlDoc) {
        const imageField = xmlDoc.getAttribute("image_field");
        return { imageField };
    }
}
```

In `gallery_view.js`:
```js
import { registry } from "@web/core/registry";
import { GalleryArchParser } from "./gallery_arch_parser";
import { GalleryController } from "./gallery_controller";

export const galleryView = {
    type: "gallery",
    display_name: "Gallery",
    icon: "fa fa-th-large",
    multiRecord: true,
    Controller: GalleryController,
    ArchParser: GalleryArchParser,
    props: (genericProps, view) => {
        const { arch, resModel } = genericProps;
        const archInfo = new view.ArchParser().parse(arch, null, resModel);
        return { ...genericProps, archInfo };
    },
};

registry.category("views").add("gallery", galleryView);
```

## Step 4 — Load data via `webSearchRead` [TUTORIAL TEXT: 18.0, APIS VERIFIED: 19.0]

In `gallery_controller.js`:
```js
import { Component, onWillStart, onWillUpdateProps, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { Layout } from "@web/search/layout";

export class GalleryController extends Component {
    static template = "awesome_gallery.GalleryController";
    static components = { Layout };
    static props = ["*"];

    setup() {
        this.orm = useService("orm");
        this.state = useState({ records: [] });

        onWillStart(() => this.loadImages(this.props.domain));
        onWillUpdateProps((next) => this.loadImages(next.domain));
    }

    async loadImages(domain) {
        const { imageField } = this.props.archInfo;
        const { records } = await this.orm.webSearchRead(
            this.props.resModel,
            domain,
            {
                specification: {
                    [imageField]: {},
                },
                context: { bin_size: true },
            },
        );
        this.state.records = records;
    }
}
```

**Why `bin_size: true`?** Without it, image fields return base64 content inline (huge payload). With it, you get the size string and can build `/web/image` URLs instead.

## Step 5 — Concurrency with `KeepLast` [TUTORIAL TEXT: 18.0, APIS VERIFIED: 19.0]

```js
import { KeepLast } from "@web/core/utils/concurrency";

setup() {
    // ...
    this.keepLast = new KeepLast();
}

async loadImages(domain) {
    const { imageField } = this.props.archInfo;
    const { records } = await this.keepLast.add(
        this.orm.webSearchRead(this.props.resModel, domain, {
            specification: { [imageField]: {} },
            context: { bin_size: true },
        }),
    );
    this.state.records = records;
}
```

Only the most recent `webSearchRead` resolves to `this.state.records`.

## Step 6 — Reorganize into Model + Renderer [TUTORIAL TEXT: 18.0, APIS VERIFIED: 19.0]

The standard split:

### `gallery_model.js`
```js
import { KeepLast } from "@web/core/utils/concurrency";

export class GalleryModel {
    constructor(orm, resModel, archInfo) {
        this.orm = orm;
        this.resModel = resModel;
        this.archInfo = archInfo;
        this.keepLast = new KeepLast();
        this.records = [];
    }

    async load(domain) {
        const { records } = await this.keepLast.add(
            this.orm.webSearchRead(this.resModel, domain, {
                specification: { [this.archInfo.imageField]: {} },
                context: { bin_size: true },
            }),
        );
        this.records = records;
    }
}
```

### `gallery_renderer.js`
```js
import { Component } from "@odoo/owl";
import { url as buildUrl } from "@web/core/utils/urls";

export class GalleryRenderer extends Component {
    static template = "awesome_gallery.GalleryRenderer";
    static props = ["records", "resModel", "archInfo"];

    getImageUrl(record) {
        return buildUrl("/web/image", {
            model: this.props.resModel,
            id: record.id,
            field: this.props.archInfo.imageField,
        });
    }
}
```

### `gallery_renderer.xml`
```xml
<t t-name="awesome_gallery.GalleryRenderer">
    <div class="o_gallery_grid d-flex flex-wrap gap-2 p-3">
        <div t-foreach="props.records" t-as="record" t-key="record.id"
             class="o_gallery_card">
            <img t-att-src="getImageUrl(record)" class="img-thumbnail"/>
        </div>
    </div>
</t>
```

### Controller wires them
```js
import { Component, onWillStart, onWillUpdateProps, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { Layout } from "@web/search/layout";
import { GalleryModel } from "./gallery_model";
import { GalleryRenderer } from "./gallery_renderer";

export class GalleryController extends Component {
    static template = "awesome_gallery.GalleryController";
    static components = { Layout, GalleryRenderer };
    static props = ["*"];

    setup() {
        this.orm = useService("orm");
        this.model = useState(new GalleryModel(
            this.orm, this.props.resModel, this.props.archInfo
        ));
        onWillStart(() => this.model.load(this.props.domain));
        onWillUpdateProps((next) => this.model.load(next.domain));
    }
}
```

## Step 7 — Make the view extensible [TUTORIAL TEXT: 18.0, APIS VERIFIED: 19.0]

Expose `Model` and `Renderer` on the descriptor so other modules can swap them:

```js
// gallery_view.js
export const galleryView = {
    type: "gallery",
    display_name: "Gallery",
    icon: "fa fa-th-large",
    multiRecord: true,
    Controller: GalleryController,
    ArchParser: GalleryArchParser,
    Model: GalleryModel,
    Renderer: GalleryRenderer,
    props: (genericProps, view) => {
        const archInfo = new view.ArchParser().parse(genericProps.arch, null, genericProps.resModel);
        return {
            ...genericProps,
            archInfo,
            Model: view.Model,
            Renderer: view.Renderer,
        };
    },
};
```

The controller then uses dynamic components:
```xml
<Layout className="'o_gallery_view'" display="props.display">
    <t t-component="props.Renderer"
       records="model.records"
       resModel="props.resModel"
       archInfo="props.archInfo"/>
</Layout>
```

Other modules extend:
```js
import { galleryView } from "@awesome_gallery/gallery_view";
import { GalleryRenderer } from "@awesome_gallery/gallery_renderer";

class MyGalleryRenderer extends GalleryRenderer {
    static template = "my_module.MyGalleryRenderer";
    // custom stuff
}

registry.category("views").add("my_gallery", {
    ...galleryView,
    Renderer: MyGalleryRenderer,
});
```

And arch uses `<gallery js_class="my_gallery">...`.

## Step 8 — Click opens form [TUTORIAL TEXT: 18.0, APIS VERIFIED: 19.0]

```js
import { useService } from "@web/core/utils/hooks";

// In the renderer:
setup() {
    this.action = useService("action");
}

openRecord(record) {
    this.action.switchView("form", { resId: record.id });
}
```

## Step 9 — Optional tooltip [TUTORIAL TEXT: 18.0, APIS VERIFIED: 19.0]

Arch:
```xml
<gallery image_field="image_1920" tooltip_field="name"/>
```

ArchParser:
```js
parse(xmlDoc) {
    return {
        imageField: xmlDoc.getAttribute("image_field"),
        tooltipField: xmlDoc.getAttribute("tooltip_field"),
    };
}
```

Renderer: bind to `data-tooltip`:
```xml
<img t-att-src="getImageUrl(record)"
     t-att-data-tooltip="props.archInfo.tooltipField ? record[props.archInfo.tooltipField] : null"
     class="img-thumbnail"/>
```

## Step 10 — Pagination [TUTORIAL TEXT: 18.0, APIS VERIFIED: 19.0]

`usePager` from `@web/search/pager_hook` registers a callback that the `Layout` component reads to render the pager in the control panel. Source: `addons/web/static/src/views/list/list_controller.js` is the canonical reference.

**Extend the Model** to know about `offset`/`limit` and a total count:
```js
// gallery_model.js
export class GalleryModel {
    constructor(orm, resModel, archInfo) {
        this.orm = orm;
        this.resModel = resModel;
        this.archInfo = archInfo;
        this.keepLast = new KeepLast();
        this.records = [];
        this.count = 0;
    }

    async load(domain, { offset = 0, limit = 80 } = {}) {
        const { records, length } = await this.keepLast.add(
            this.orm.webSearchRead(this.resModel, domain, {
                specification: { [this.archInfo.imageField]: {} },
                context: { bin_size: true },
                offset,
                limit,
            }),
        );
        this.records = records;
        this.count = length;
    }
}
```

**Wire the pager in the Controller:**
```js
// gallery_controller.js
import { usePager } from "@web/search/pager_hook";

setup() {
    this.orm = useService("orm");
    this.state = useState({ offset: 0, limit: 80 });
    this.model = useState(new GalleryModel(this.orm, this.props.resModel, this.props.archInfo));

    onWillStart(() => this.model.load(this.props.domain, this.state));
    onWillUpdateProps((next) => this.model.load(next.domain, this.state));

    usePager(() => ({
        offset: this.state.offset,
        limit: this.state.limit,
        total: this.model.count,
        onUpdate: async ({ offset, limit }) => {
            this.state.offset = offset;
            this.state.limit = limit;
            await this.model.load(this.props.domain, this.state);
        },
    }));
}
```

The pager appears automatically in the control panel area whenever `usePager` is registered — no template change is needed.

## Step 11 — RNG validation [TUTORIAL TEXT: 18.0, APIS VERIFIED: 19.0]

Write an RNG schema, e.g. `awesome_gallery/rng/gallery_view.rng`, and register validation in Python:

```python
import os
from lxml import etree
from odoo.loglevels import ustr
from odoo.tools import misc, view_validation

_gallery_validator = None

@view_validation.validate('gallery')
def schema_gallery(arch, **kwargs):
    global _gallery_validator
    if _gallery_validator is None:
        with misc.file_open(os.path.join('awesome_gallery', 'rng', 'gallery_view.rng')) as f:
            _gallery_validator = etree.RelaxNG(etree.parse(f))
    if _gallery_validator.validate(arch):
        return True
    for error in _gallery_validator.error_log:
        _logger.error(ustr(error))
    return False
```

Alternative — implement `_validate_tag_gallery` on your `_inherit = 'ir.ui.view'` (like `web_hierarchy._validate_tag_hierarchy`). This approach requires no RNG file and lets you check field existence (e.g. "`image_field` must exist on the model").

## Step 12 — Image upload [TUTORIAL TEXT: 18.0, APIS VERIFIED: 19.0]

Use `FileUploader` from `@web/views/fields/file_handler`:

```js
import { FileUploader } from "@web/views/fields/file_handler";

// in the renderer
static components = { FileUploader };

async onFileUploaded({ data }) {
    const recordId = /* current record id */;
    await this.orm.webSave(this.props.resModel, [recordId], {
        [this.props.archInfo.imageField]: data,
    });
    // reload
}
```

Append `&write_date=<value>` to `/web/image` URLs to bust the browser cache after upload.

## Step 13 — Advanced tooltip template [TUTORIAL TEXT: 18.0, APIS VERIFIED: 19.0]

Accept nested `<field>` declarations and a `<tooltip-template>` sub-element:
```xml
<gallery image_field="image_1920" tooltip_field="name">
    <field name="email"/>
    <field name="phone"/>
    <tooltip-template>
        <p>Name: <field name="name"/></p>
        <p>Email: <field name="email"/></p>
    </tooltip-template>
</gallery>
```

Use `visitXML` from `@web/core/utils/xml` to walk the arch:
```js
import { visitXML } from "@web/core/utils/xml";

parse(xmlDoc) {
    const fieldNames = [];
    let tooltipTemplate = null;
    visitXML(xmlDoc, (node) => {
        if (node.tagName === "field") {
            fieldNames.push(node.getAttribute("name"));
        } else if (node.tagName === "tooltip-template") {
            tooltipTemplate = node;
        }
    });
    return {
        imageField: xmlDoc.getAttribute("image_field"),
        tooltipField: xmlDoc.getAttribute("tooltip_field"),
        fieldNames,
        tooltipTemplate,
    };
}
```

**Render the parsed `tooltipTemplate` from the Renderer.** Two patterns work:

**(a) Register the parsed XML as a QWeb template at view-construction time** (one-shot, simpler):
```js
// gallery_renderer.js
import { Component, xml } from "@odoo/owl";
import { useTooltip } from "@web/core/tooltip/tooltip_hook";
import { templates } from "@web/core/templates";

export class GalleryRenderer extends Component {
    static template = "awesome_gallery.GalleryRenderer";
    static props = ["records", "resModel", "archInfo"];

    setup() {
        if (this.props.archInfo.tooltipTemplate) {
            // Wrap the parsed <tooltip-template> body in a QWeb <t t-name="…">
            const tplName = `awesome_gallery.tooltip_${this.props.resModel}`;
            const tplDoc = `<t t-name="${tplName}">${this.props.archInfo.tooltipTemplate.innerHTML}</t>`;
            templates.add(tplName, tplDoc);
            this.tooltipTemplate = tplName;
        }
        useTooltip("imageRef", {
            template: this.tooltipTemplate,
            info: (el) => ({ record: this.records[Number(el.dataset.index)] }),
        });
    }
}
```

**(b) Render to an HTML string and use `data-tooltip` directly** (no QWeb registration; loses reactivity inside the tooltip — fine for static content).

The `useTooltip` hook lives in `@web/core/tooltip/tooltip_hook`; it expects either a `template` (QWeb template name) plus `info` (returns the rendering context) or a static `tooltip` string.

## Wrap up

The gallery view touches every part of the framework:

- JS registry and view descriptor ✓
- Python `ir.ui.view.type` and `ir.actions.act_window.view.view_mode` ✓
- Arch XML with custom attributes and nested tags ✓
- ArchParser class with `visitXML` ✓
- Custom Model (not `RelationalModel`) + Renderer ✓
- `Layout` component with `display` prop ✓
- `webSearchRead` + `KeepLast` ✓
- Dynamic components for extensibility (`props.Renderer`) ✓
- `js_class` extension pattern ✓
- Server-side arch validation ✓
- Integration with the action service (`switchView`) ✓

Once you've walked through this, every other custom view (timeline, whiteboard, tree view, etc.) follows the same skeleton. The only thing that changes per view type is **what the renderer draws** and **what the arch looks like**.

## Key sources

- Starter module @ 19.0: https://github.com/odoo/tutorials/tree/19.0/awesome_gallery
- 18.0 walkthrough (TUTORIAL TEXT source): https://www.odoo.com/documentation/18.0/developer/tutorials/master_odoo_web_framework/02_create_gallery_view.html
- Public 19.0 reference views: https://github.com/odoo/odoo/tree/19.0/addons/web/static/src/views
- Community custom-view reference implementation: https://github.com/odoo/odoo/tree/19.0/addons/web_hierarchy
