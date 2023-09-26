# Prettier plugin sort imports <!-- omit in toc -->

A prettier plugin to sort import declarations by provided Regular Expression order, while preserving side-effect import order.

This project is based on [@trivago/prettier-plugin-sort-imports](https://github.com/trivago/prettier-plugin-sort-imports), but adds additional features:

- Does not re-order across side-effect imports
- Combines imports from the same source
- Combines type and value imports (if `importOrderTypeScriptVersion` is set to `"4.5.0"` or higher)
- Groups type imports with `<TYPES>` keyword
- Sorts node.js builtin modules to top (configurable with `<BUILTIN_MODULES>` keyword)
- Supports custom import order separation
- Handles comments around imports correctly
- Simplifies options for easier configuration

[We welcome contributions!](./CONTRIBUTING.md)

## Table of Contents <!-- omit in toc -->

- [Sample](#sample)
  - [Input](#input)
  - [Output](#output)
- [Install](#install)
- [Usage](#usage)
  - [How does import sort work?](#how-does-import-sort-work)
  - [Options](#options)
    - [`importOrder`](#importorder)
      - [1. Put specific dependencies at the top](#1-put-specific-dependencies-at-the-top)
      - [2. Keep css modules at the bottom](#2-keep-css-modules-at-the-bottom)
      - [3. Add spaces between import groups](#3-add-spaces-between-import-groups)
      - [4. Group type imports separately from values](#4-group-type-imports-separately-from-values)
      - [5. Group aliases with local imports](#5-group-aliases-with-local-imports)
      - [6. Enforce a blank line after top of file comments](#6-enforce-a-blank-line-after-top-of-file-comments)
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

```shell
npm install --save-dev @ianvs/prettier-plugin-sort-imports
```

yarn

```shell
yarn add --dev @ianvs/prettier-plugin-sort-imports
```

pnpm

```shell
pnpm add --save-dev @ianvs/prettier-plugin-sort-imports
```

**Note: If you are migrating from v3.x.x to v4.x.x, please read the [migration guidelines](./docs/MIGRATION.md)**

## Usage

Add your preferred settings in your prettier config file.

```ts
// @ts-check

/** @type {import("@ianvs/prettier-plugin-sort-imports").PrettierConfig} */
module.exports = {
    // Standard prettier options
    singleQuote: true,
    semi: true,
    // Since prettier 3.0, manually specifying plugins is required
    plugins: ['@ianvs/prettier-plugin-sort-imports'],
    // This plugin's options
    importOrder: ['^@core/(.*)$', '', '^@server/(.*)$', '', '^@ui/(.*)$', '', '^[./]'],
    importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
    importOrderTypeScriptVersion: '5.0.0',
};
```

### How does import sort work?

The plugin extracts the imports which are defined in `importOrder`. These imports are considered as _local imports_.
The imports which are not part of the `importOrder` are considered to be _third party imports_.

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

By default the plugin returns final imports with _nodejs built-in modules_, followed by _third party imports_ and subsequent _local imports_ at the end.

- The _nodejs built-in modules_ position (it's 1st by default) can be overridden using the `<BUILTIN_MODULES>` special word in the `importOrder`
- The _third party imports_ position (it's 2nd by default) can be overridden using the `<THIRD_PARTY_MODULES>` special word in the `importOrder`.

### Options

#### `importOrder`

**type**: `Array<string>`

The main way to control the import order and formatting, `importOrder` is a collection of Regular expressions in string format, along with a few "special case" strings that you can use.

**default value**:

```js
[
    '<BUILTIN_MODULES>', // Node.js built-in modules
    '<THIRD_PARTY_MODULES>', // Imports not matched by other special words or groups.
    '^[.]', // relative imports
],
```

By default, this plugin sorts as documented on the line above, with Node.js built-in modules at the top, followed by non-relative imports, and lastly any relative import starting with a `.` character.

Available Special Words:

- `<BUILTIN_MODULES>` - All _nodejs built-in modules_ will be grouped here, and is injected at the top if it's not present.
- `<THIRD_PARTY_MODULES>` - All imports not targeted by another regex will end up here, so this will be injected if not present in `importOrder`
- `<TYPES>` - Not active by default, this allows you to group all type-imports, or target them with a regex (`<TYPES>^[.]` targets imports of types from local files).

Here are some common ways to configure `importOrder`:

##### 1. Put specific dependencies at the top

Some styles call for putting the import of `react` at the top of your imports, which you could accomplish like this:

```json
"importOrder": ["^react$", "<THIRD_PARTY_MODULES>", "^[.]"]
```

e.g.:

```ts
import * as React from 'react';
import cn from 'classnames';
import MyApp from './MyApp';
```

##### 2. Keep css modules at the bottom

Imports of CSS files are often placed at the bottom of the list of imports, and can be accomplished like so:

```json
"importOrder": ["<THIRD_PARTY_MODULES>", "^(?!.*[.]css$)[./].*$", ".css$"]
```

e.g.:

```ts
import * as React from 'react';
import MyApp from './MyApp';
import styles from './global.css';
```

##### 3. Add spaces between import groups

If you want to group your imports into "chunks" with blank lines between, you can add empty strings like this:

```json
"importOrder": ["<BUILT_IN_MODULES>", "", "<THIRD_PARTY_MODULES>", "", "^[.]"]
```

e.g.:

```ts
import fs from 'fs';

import { debounce, reduce } from 'lodash';

import MyApp from './MyApp';
```

##### 4. Group type imports separately from values

If you're using Flow or TypeScript, you might want to separate out your type imports from imports of values.  And to be especially fancy, you can even group 3rd party types together, and your own local type imports separately:

```json
"importOrder": ["<TYPES>", "<TYPES>^[.]", "<THIRD_PARTY_MODULES>", "^[.]"]
```

e.g.:

```ts
import type { Logger } from '@tanstack/react-query';
import type { Location } from 'history';
import type {Props} from './App';
import { QueryClient} from '@tanstack/react-query';
import { createBrowserHistory } from 'history';
import App from './App';
```

##### 5. Group aliases with local imports

If you define non-relative aliases to refer to local files without long chains of `"../../../"`, you can include those aliases in your `importOrder` to keep them grouped with your local code.

```json
"importOrder": [
    "<THIRD_PARTY_MODULES>",
    "^(@api|@assets|@ui)(/.*)$",
    "^[.]"]
```

e.g.:

```ts
import { debounce, reduce } from 'lodash';
import { Users } from '@api';
import icon from '@assets/icon';
import App from './App';
```

##### 6. Enforce a blank line after top of file comments

If you have pragma-comments at the top of file, or you have boilerplate copyright announcements, you may be interested in separating that content from your code imports, you can add that separator first.

```json
"importOrder": [
    "",
    "^[.]"
]
```

e.g.:

```ts
/**
 * @prettier
 */

import { promises } from 'fs';
import { Users } from '@api';
import icon from '@assets/icon';
import App from './App';
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

- If you have one or more comments at the top of the file, we will keep them at the top.
- Comments on lines after the final import statement will not be moved. (Runtime-code between imports will be moved below all the imports).
- In general, if you place a comment on the same line as an Import `Declaration` or `*Specifier`, we will keep it attached to that same specifier if it moves around.
- Other comments are preserved, and are generally considered "leading" comments for the subsequent Import `Declaration` or `*Specifier`.

## FAQ / Troubleshooting

Having some trouble or an issue? You can check [FAQ / Troubleshooting section](./docs/TROUBLESHOOTING.md).

## Compatibility

| Framework              | Supported     | Note                                                       |
| ---------------------- | ------------- | ---------------------------------------------------------- |
| JS with ES Modules     | ✅ Everything | -                                                          |
| NodeJS with ES Modules | ✅ Everything | -                                                          |
| React                  | ✅ Everything | -                                                          |
| Angular                | ✅ Everything | Supported through `importOrderParserPlugins` API           |
| Vue                    | ✅ Everything | SFCs only, peer dependency `@vue/compiler-sfc` is required |
| Svelte                 | ⚠️ Not yet    | Contributions are welcome                                  |

## Contribution

For more information regarding contribution, please check the [Contributing Guidelines](./CONTRIBUTING.md). If you are trying to
debug some code in the plugin, check [Debugging Guidelines](./docs/DEBUG.md)

## Disclaimer

This plugin modifies the AST which is against the rules of prettier.
