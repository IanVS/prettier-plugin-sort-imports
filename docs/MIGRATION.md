## Migration Guide

---

### Migrating from v3.x.x to v4.x.x

- The `importOrderBuiltinModulesToTop` option has been removed, and node.js built in modules are sorted to the top by default.  The position can be controled using the new `<BUILTIN_MODULES>` keyword in `importOrder`.
- The `importOrderSeparation` option has been removed.  Use empty quotes in your `importOrder` to control the placement of blank lines.
- The `importOrderCaseInsensitive` option has been removed, and imports will always be sorted case-insensitive.
- The `importOrderGroupNamespaceSpecifiers` option has been removed.
- The `importOrderSortSpecifiers` option has been removed, and specifiers are now always sorted (previous `true` setting)
- The `importOrderMergeDuplicateImports` option has been removed, and imports are always combined (previous `true` setting)
- The `importOrderCombineTypeAndValueImports` option has been removed.  See [below](#importOrderCombineTypeAndValueImports-removed) for details
- Added `importOrderTypeScriptVersion` option.
- The default `importOrder` was improved.  It now sorts node.js built-ins, then non-relative imports, then relative imports. If you have an `importOrder` specified, this will not affect you.

#### `importOrderSeparation` removed

This option was removed to simplify the configuration of the plugin. But if you like to separate your import groups with newlines, you can do so by adding `""` groups to your `importOrder` array.

For example:

```js
    "importOrder": [
        "", // This emptry group at the start will add separators for side-effect imports and node.js built-in modules
        "<THIRD_PARTY_MODULES>",
        "",
        "^@app/(.*)$",
        "",
        "^[./]"
    ]
```

Or, if you would like to keep all imports together, but add a newline before side-effect imports:

```js
    "importOrder": [
        "<THIRD_PARTY_MODULES>",
        "^@app/(.*)$",
        "^[./]"
        "", // This will add a newline between side-effect groups (i.e. the chunks that are sorted)
    ]
```

#### `importOrderCombineTypeAndValueImports` removed

Combining type and value imports is supported in Flow and TypeScript 4.5.0 and above.  To simplify the configuration of the plugin, the explicit setting has been removed.  Instead, we will always enable combining these imports when using Flow and have introduced a new option, `importOrderTypeScriptVersion` to control whether or not merging can happen when using TypeScript.

#### `importOrderTypeScriptVersion` added

Some import statement syntax can only be used in certain versions of TypeScript.  In order to enable these features, such as merging type and value imports, you can specify the version of TypeScript that you're using in your project using this option, which should be a valid semver string.


### Migrating from v2.x.x to v3.x.x

#### TL;DR

-   Replace `experimentalBabelParserPluginsList` with the new `importOrderParserPlugins` in your prettier config.
-   Use the `importOrderSortSpecifiers` to sort import specifiers.
-   Use `<THIRD_PARTY_MODULES>` special word in `importOrder` to place your third party imports at any location.
-   Disable case sensitivity in the soring via `importOrderCaseInsensitive` option.
-   Use `importOrderSeparation` to separate the import groups.

#### New changes

-   **Sort the import specifiers**:
    The plugin is now able to sort the import specifiers in an import declaration.
    This can be achieved by setting up the `importOrderSortSpecifiers` boolean flag.
    [See usage](../README.md#importordersortspecifiers)

Input:

```ts
import { a, d, c, b } from 'some-package'
```

Output:

```ts
import { a, b, c, d } from 'some-package'
```

-   **Place third party modules anywhere in the imports**:
    You can place the third party import at the desired place in import order. [See usage](../README.md#importorderseparation)

Prettier config:

```ts
module.exports = {
    "importOrder": ["^@core/(.*)$", "<THIRD_PARTY_MODULES>", "^@ui/(.*)$", "^[./]"]
}
```

Input:

```ts
import threeLevelRelativePath from '../../../threeLevelRelativePath';
import sameLevelRelativePath from './sameLevelRelativePath';
import thirdPartyTwo from 'third-party-2';
import otherthing from '@core/otherthing';
import thirdPartyOne from 'third-party-1';
import twoLevelRelativePath from '../../twoLevelRelativePath';
import component from '@ui/hello';
import thirdPartyThree from 'third-party-3';
```

Output:

```ts
import otherthing from '@core/otherthing';
import thirdPartyOne from 'third-party-1';
import thirdPartyTwo from 'third-party-2';
import thirdPartyThree from 'third-party-3';
import component from '@ui/hello';
import threeLevelRelativePath from '../../../threeLevelRelativePath';
import twoLevelRelativePath from '../../twoLevelRelativePath';
import sameLevelRelativePath from './sameLevelRelativePath';
```

-   **Disable case sensitivity for sorting**:
    By default, the case sensitivity for the sorting is enabled. Now you can disable
    the case sensitivity with the `importOrderCaseInsensitive` option. [See usage](../README.md#importordercaseinsensitive)

-   **Pass options to the Babel parser plugins**:
    You can pass the options to the babel parser plugins via the `importOrderParserPlugins` option. [See usage](../README.md#importorderparserplugins)

#### Breaking changes

-   **Renaming of `experimentalBabelParserPluginsList`**:
    In version 3, the `experimentalBabelParserPluginsList` has been removed. You can
    use the same API with a new name and better option handling for babel parser. [See usage](../README.md#importorderparserplugins)
