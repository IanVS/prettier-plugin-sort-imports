NOTE: These docs are for the upcoming version 4.0.  View the [3.X readme](https://github.com/IanVS/prettier-plugin-sort-imports/tree/main#readme) for the latest stable release, or the [migration guide](https://github.com/IanVS/prettier-plugin-sort-imports/blob/next/docs/MIGRATION.md#migrating-from-v3xx-to-v4xx) for the changes so far.

# Prettier plugin sort imports <!-- omit in toc -->

A prettier plugin to sort import declarations by provided Regular Expression order.

This was forked from [@trivago/prettier-plugin-sort-imports](https://github.com/trivago/prettier-plugin-sort-imports).

The first change was preserving the order of [side-effect imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#import_a_module_for_its_side_effects_only) to avoid breaking situations where import-order has correctness implications (such as styles).

Since then more critical features & fixes have been added, and the options have been simplified.

**Features not currently supported by upstream:**

-   Do not re-order across side-effect imports
-   Combine imports from the same source
-   Combine type and value imports
-   Type import grouping with `<TYPES>` keyword
-   Sorts node.js builtin modules to top
-   Custom import order separation

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
    - [`importOrderTypeScriptVersion`](#importordertypescriptversion)
    - [`importOrderParserPlugins`](#importorderparserplugins)
  - [Prevent imports from being sorted](#prevent-imports-from-being-sorted)
  - [Comments](#comments)
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

**Note: If you are migrating from v3.x.x to v4.x.x, [Please Read Migration Guidelines](./docs/MIGRATION.md)**

## Usage

Add your preferred settings in your prettier config file.

```ts
// @ts-check

/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig} */
module.exports = {
    printWidth: 80,
    tabWidth: 4,
    trailingComma: 'all',
    singleQuote: true,
    semi: true,
    importOrder: ['^@core/(.*)$', '', '^@server/(.*)$', '', '^@ui/(.*)$', '', '^[./]'],
    importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
    importOrderTypeScriptVersion: '5.0.0',
};
```

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

_Default:_

```js
[
            // built-ins are implicitly first
    '<THIRD_PARTY_MODULES>',
    '^[.]', // relative imports
],
```

By default, this plugin sorts as documented on the line above.

The plugin moves the third party imports to the top which are not part of the `importOrder` list.
To move the third party imports at desired place, you can use `<THIRD_PARTY_MODULES>` to assign third party imports to the appropriate position:

```json
"importOrder": ["^@core/(.*)$", "<THIRD_PARTY_MODULES>", "^@server/(.*)$", "^@ui/(.*)$", "^[./]"],
```

If you would like to order type imports differently from value imports, you can use the special `<TYPES>` string. This example will place third party types at the top, followed by local types, then third party value imports, and lastly local value imports:

```json
"importOrder": ["<TYPES>", "<TYPES>^[./]", "<THIRD_PARTY_MODULES>", "^[./]"],
```

_Note:_ If you want to separate some groups from others, you can add an empty string to your `importOrder` array to signify newlines. For example:

```js
"importOrder": [
   "^react", // React will be placed at the top of third-party modules
    "<THIRD_PARTY_MODULES>",
    "",  // use empty strings to separate groups with empty lines
    "^[./]"
],
```

#### `importOrderTypeScriptVersion`

**type**: `string`

**default value:** `1.0.0`

When using TypeScript, some import syntax can only be used in newer versions of TypeScript.  If you would like to enable modern features like mixed type and value imports, set this option to the semver version string of the TypeScript in use in your project.

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

### Comments

We make the following attempts at keeping comments in your imports clean:

- If you have one or more comments at the top of the file, we will keep them at the top as long as there is a blank line before your first import statement.
- Comments on lines after the final import statement will not be moved. (Runtime-code between imports will be moved below all the imports).
- In general, if you place a comment on the same line as an Import `Declaration` or `*Specifier`, we will keep it attached to that same specifier if it moves around.
- Other comments are preserved, and are generally considered "leading" comments for the subsequent Import `Declaration` or `*Specifier`.

## FAQ / Troubleshooting

Having some trouble or an issue? You can check [FAQ / Troubleshooting section](./docs/TROUBLESHOOTING.md).

## Compatibility

| Framework              | Supported     | Note                                             |
| ---------------------- | ------------- | ------------------------------------------------ |
| JS with ES Modules     | ✅ Everything | -                                                |
| NodeJS with ES Modules | ✅ Everything | -                                                |
| React                  | ✅ Everything | -                                                |
| Angular                | ✅ Everything | Supported through `importOrderParserPlugins` API |
| Vue                    | ✅ Everything | Peer dependency `@vue/compiler-sfc` is required  |
| Svelte                 | ⚠️ Not yet    | Contributions are welcome                        |

## Contribution

For more information regarding contribution, please check the [Contributing Guidelines](./CONTRIBUTING.md). If you are trying to
debug some code in the plugin, check [Debugging Guidelines](./docs/DEBUG.md)

## Disclaimer

This plugin modifies the AST which is against the rules of prettier.
