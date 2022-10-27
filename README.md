# Prettier plugin sort imports <!-- omit in toc -->

A prettier plugin to sort import declarations by provided Regular Expression order.

This was forked from [@trivago/prettier-plugin-sort-imports](https://github.com/trivago/prettier-plugin-sort-imports).

The first change was preserving the order of [side-effect imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#import_a_module_for_its_side_effects_only) to avoid breaking situations where import-order has correctness implications (such as styles).

Since then more critical features & fixes have been added. As a result, this repo intends to stay compatible with the upstream, but may continue to gain features not present in the original version of the plugin.

**Features not currently supported by upstream:**

- Do not re-order across side-effect imports
- Combine imports from the same source ([`importOrderMergeDuplicateImports`](#importordermergeduplicateimports))
- Combine type and value imports ([`importOrderCombineTypeAndValueImports`](#importordercombinetypeandvalueimports))
- Sort node.js builtin modules to top ([`importOrderBuiltinModulesToTop`](#importorderbuiltinmodulestotop))
- Custom import order separation ([`importOrderSeparation`](#importorderseparation))

[We welcome contributions!](./CONTRIBUTING.md)

**Table of Contents**

- [Sample](#sample)
  - [Input](#input)
  - [Output](#output)
- [Install](#install)
- [Usage](#usage)
  - [How does import sort work?](#how-does-import-sort-work)
  - [Options](#options)
    - [`importOrder`](#importorder)
    - [`importOrderSeparation`](#importorderseparation)
    - [`importOrderSortSpecifiers`](#importordersortspecifiers)
    - [`importOrderGroupNamespaceSpecifiers`](#importordergroupnamespacespecifiers)
    - [`importOrderCaseInsensitive`](#importordercaseinsensitive)
    - [`importOrderMergeDuplicateImports`](#importordermergeduplicateimports)
    - [`importOrderCombineTypeAndValueImports`](#importordercombinetypeandvalueimports)
    - [`importOrderParserPlugins`](#importorderparserplugins)
    - [`importOrderBuiltinModulesToTop`](#importorderbuiltinmodulestotop)
  - [Prevent imports from being sorted](#prevent-imports-from-being-sorted)
- [FAQ / Troubleshooting](#faq--troubleshooting)
- [Compatibility](#compatibility)
- [Contribution](#contribution)
- [Disclaimer](#disclaimer)

## Sample

### Input

```javascript
// prettier-ignore
import { environment } from "./misguided-module-with-side-effects.js";

import "core-js/stable";
import "regenerator-runtime/runtime";
import React, {
    FC,
    useEffect,
    useRef,
    ChangeEvent,
    KeyboardEvent,
} from 'react';
import { logger } from '@core/logger';
import { reduce, debounce } from 'lodash';
import { Message } from '../Message';
import { createServer } from '@server/node';
import { Alert } from '@ui/Alert';
import { repeat, filter, add } from '../utils';
import { initializeApp } from '@core/app';
import { Popup } from '@ui/Popup';
import { createConnection } from '@server/database';
```

### Output

```javascript
// prettier-ignore
import { environment } from "./misguided-module-with-side-effects.js";

import "core-js/stable";
import "regenerator-runtime/runtime";
import { debounce, reduce } from 'lodash';
import React, {
    ChangeEvent,
    FC,
    KeyboardEvent,
    useEffect,
    useRef,
} from 'react';

import { createConnection } from '@server/database';
import { createServer } from '@server/node';

import { initializeApp } from '@core/app';
import { logger } from '@core/logger';

import { Alert } from '@ui/Alert';
import { Popup } from '@ui/Popup';

import { Message } from '../Message';
import { add, filter, repeat } from '../utils';
```

## Install

npm

```shell script
npm install --save-dev @ianvs/prettier-plugin-sort-imports
```

or, using yarn

```shell script
yarn add --dev @ianvs/prettier-plugin-sort-imports
```

**Note: If you are migrating from v2.x.x to v3.x.x, [Please Read Migration Guidelines](./docs/MIGRATION.md)**

## Usage

Add your preferred settings in your prettier config file.

```ts
// @ts-check

/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig} */
module.exports = {
  "printWidth": 80,
  "tabWidth": 4,
  "trailingComma": "all",
  "singleQuote": true,
  "semi": true,
  "importOrder": ["^@core/(.*)$", "^@server/(.*)$", "^@ui/(.*)$", "^[./]"],
  "importOrderBuiltinModulesToTop": true,
  "importOrderCaseInsensitive": true,
  "importOrderParserPlugins": ["typescript", "jsx", "decorators-legacy"],
  "importOrderMergeDuplicateImports": true,
  "importOrderCombineTypeAndValueImports": true,
  "importOrderSeparation": true,
  "importOrderSortSpecifiers": true,
}
```

_Note: all flags are off by default, so explore your options [below](#options)_

### How does import sort work?

The plugin extracts the imports which are defined in `importOrder`. These imports are considered as _local imports_.
The imports which are not part of the `importOrder` is considered as _third party imports_.

First, the plugin checks for
[side effect imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#import_a_module_for_its_side_effects_only),
such as `import 'mock-fs'`. These imports often modify the global scope or apply some patches to the current
environment, which may affect other imports. To preserve potential side effects, these kind of side effect imports are
classified as unsortable. They also behave as a barrier that other imports may not cross during the sort. So for
example, let's say you've got these imports:

```javascript
import E from 'e';
import F from 'f';
import D from 'd';
import 'c';
import B from 'b';
import A from 'a';
```

Then the first three imports are sorted and the last two imports are sorted, but all imports above `c` stay above `c`
and all imports below `c` stay below `c`, resulting in:

```javascript
import D from 'd';
import E from 'e';
import F from 'f';
import 'c';
import A from 'a';
import B from 'b';
```

Additionally, any import statements lines that are preceded by a `// prettier-ignore` comment are also classified as
unsortable. This can be used for edge-cases, such as when you have a named import with side-effects.

Next, the plugin sorts the _local imports_ and _third party imports_ using [natural sort algorithm](https://en.wikipedia.org/wiki/Natural_sort_order).

In the end, the plugin returns final imports with _third party imports_ on top and _local imports_ at the end.

The _third party imports_ position (it's top by default) can be overridden using the `<THIRD_PARTY_MODULES>` special word in the `importOrder`.

### Options

#### `importOrder`

**type**: `Array<string>`

A collection of Regular expressions in string format.

```json
"importOrder": ["^@core/(.*)$", "^@server/(.*)$", "^@ui/(.*)$", "^[./]"],
```

_Default:_ `[]`

By default, this plugin will not move any imports. To separate third party from relative imports, use `["^[./]"]`. This will become the default in the next major version.

The plugin moves the third party imports to the top which are not part of the `importOrder` list.
To move the third party imports at desired place, you can use `<THIRD_PARTY_MODULES>` to assign third party imports to the appropriate position:

```json
"importOrder": ["^@core/(.*)$", "<THIRD_PARTY_MODULES>", "^@server/(.*)$", "^@ui/(.*)$", "^[./]"],
```

If you would like to order type imports differently from value imports, you can use the special `<TYPES>` string.  This example will place third party types at the top, followed by local types, then third party value imports, and lastly local value imports:

```json
"importOrder": ["<TYPES>", "<TYPES>^[./]", "<THIRD_PARTY_MODULES>", "^[./]"],
```

#### `importOrderSeparation`

**type**: `boolean`

**default value**: `false`

A boolean value to enable or disable the new line separation
between sorted import declarations group. The separation takes place according to the `importOrder`.

```json
"importOrderSeparation": true,
```

_Note:_ If you want greater control over which groups are separated from others, you can add an empty string to your `importOrder` array to signify newlines. For example:

```js
"importOrderSeparation": false,
"importOrder": [
   "^react", // React will be placed at the top of third-party modules
    "<THIRD_PARTY_MODULES>",
    "",  // use empty strings to separate groups with empty lines
    "^[./]"
],
```

#### `importOrderSortSpecifiers`

**type**: `boolean`

**default value:** `false`

A boolean value to enable or disable sorting of the specifiers in an import declarations.  If enabled, type imports will be sorted after value imports.

Before:
```ts
import Default, {type Bravo, delta as echo, charlie, type Alpha} from 'source';
```

After:
```ts
import Default, {charlie, delta as echo, type Alpha, type Bravo} from 'source';
```

#### `importOrderGroupNamespaceSpecifiers`

**type**: `boolean`

**default value:** `false`

A boolean value to enable or disable sorting the namespace specifiers to the top of the import group.

#### `importOrderCaseInsensitive`

**type**: `boolean`

**default value**: `false`

A boolean value to enable case-insensitivity in the sorting algorithm
used to order imports within each match group.

For example, when false (or not specified):

```javascript
import ExampleView from './ExampleView';
import ExamplesList from './ExamplesList';
```

compared with `"importOrderCaseInsensitive": true`:

```javascript
import ExamplesList from './ExamplesList';
import ExampleView from './ExampleView';
```

#### `importOrderMergeDuplicateImports`

**type**: `boolean`

**default value:** `false`

When `true`, multiple import statements from the same module will be combined into a single import.

#### `importOrderCombineTypeAndValueImports`

**type**: `boolean`

**default value:** `false`

A boolean value to control merging `import type` expressions into `import {…}`.

```diff
- import type { C1 } from 'c';
- import { C2 } from 'c';
+ import { type C1, C2 } from "c";

- import { D1 } from 'd';
- import type { D2 } from 'd';
+ import { D1, type D2 } from "d";

- import type { A1 } from 'a';
- import type { A2 } from 'a';
+ import type { A1, A2 } from "a";
```

#### `importOrderParserPlugins`

**type**: `Array<string>`

**default value**: `["typescript", "jsx"]`

Previously known as `experimentalBabelParserPluginsList`.

A collection of plugins for babel parser. The plugin passes this list to babel parser, so it can understand the syntaxes
used in the file being formatted. The plugin uses prettier itself to figure out the parser it needs to use but if that fails,
you can use this field to enforce the usage of the plugins' babel parser needs.

**To pass the plugins to babel parser**:

```json
  "importOrderParserPlugins" : ["classProperties", "decorators-legacy"]
```

**To pass the options to the babel parser plugins**: Since prettier options are limited to string, you can pass plugins
with options as a JSON string of the plugin array:
`"[\"plugin-name\", { \"pluginOption\": true }]"`.

```json
  "importOrderParserPlugins" : ["classProperties", "[\"decorators\", { \"decoratorsBeforeExport\": true }]"]
```

**To disable default plugins for babel parser, pass an empty array**:

```json
"importOrderParserPlugins": []
```

#### `importOrderBuiltinModulesToTop`

**type**: `boolean`

**default value:** `false`

A boolean value to enable sorting of [`node builtins`](https://nodejs.org/api/module.html#modulebuiltinmodules) to the top of all import groups.

### Prevent imports from being sorted

This plugin supports standard prettier ignore comments. By default, side-effect imports (like
`import "core-js/stable";`) are not sorted, so in most cases things should just work. But if you ever need to, you can
prevent an import from getting sorted like this:

```javascript
// prettier-ignore
import { goods } from "zealand";
import { cars } from "austria";
```

This will keep the `zealand` import at the top instead of moving it below the `austria` import. Note that since only
entire import statements can be ignored, line comments (`// prettier-ignore`) are recommended over inline comments
(`/* prettier-ignore */`).

## FAQ / Troubleshooting

Having some trouble or an issue? You can check [FAQ / Troubleshooting section](./docs/TROUBLESHOOTING.md).

## Compatibility

| Framework              | Supported                | Note                                             |
| ---------------------- | ------------------------ | ------------------------------------------------ |
| JS with ES Modules     | ✅ Everything            | -                                                |
| NodeJS with ES Modules | ✅ Everything            | -                                                |
| React                  | ✅ Everything            | -                                                |
| Angular                | ✅ Everything            | Supported through `importOrderParserPlugins` API |
| Vue                    | ✅ Everything            | Peer dependency `@vue/compiler-sfc` is required  |
| Svelte                 | ⚠️ Not yet                | Contributions are welcome                        |

## Contribution

For more information regarding contribution, please check the [Contributing Guidelines](./CONTRIBUTING.md). If you are trying to
debug some code in the plugin, check [Debugging Guidelines](./docs/DEBUG.md)

## Disclaimer

This plugin modifies the AST which is against the rules of prettier.
