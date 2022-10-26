import { ParserPlugin } from '@babel/parser';
import { Config } from 'prettier';

export type ImportOrderParserPlugin =
    | Extract<ParserPlugin, string>
    | `[${string},${string}]`;

export interface PluginConfig {
    /**
     * A collection of Regular expressions in string format.
     *
     * ```json
     * "importOrder": ["^@core/(.*)$", "^@server/(.*)$", "^@ui/(.*)$", "^[./]"],
     * ```
     *
     * _Default:_ `[]`
     *
     * By default, this plugin will not move any imports.
     * To separate third party from relative imports, use `["^[./]"]`.
     * This will become the default in the next major version.
     *
     * The plugin moves the third party imports to the top which are not part of the `importOrder` list.
     * To move the third party imports at desired place,
     * you can use `<THIRD_PARTY_MODULES>` to assign third party imports to the appropriate position:
     *
     * ```json
     * "importOrder": ["^@core/(.*)$", "<THIRD_PARTY_MODULES>", "^@server/(.*)$", "^@ui/(.*)$", "^[./]"],
     * ```
     *
     * If you would like to order type imports differently from value imports,
     * you can use the special `<TYPES>` string.
     * This example will place third party types at the top, followed by local types,
     * then third party value imports, and lastly local value imports:
     *
     * ```json
     * "importOrder": ["<TYPES>", "<TYPES>^[./]", "<THIRD_PARTY_MODULES>", "^[./]"],
     * ```
     */
    importOrder?: string[];

    /**
     * A boolean value to enable case-insensitivity in the sorting algorithm
     * used to order imports within each match group.
     *
     * For example, when false (or not specified):
     *
     * ```js
     * import ExampleView from './ExampleView';
     * import ExamplesList from './ExamplesList';
     * ```
     *
     * compared with `"importOrderCaseInsensitive": true`:
     *
     * ```js
     * import ExamplesList from './ExamplesList';
     * import ExampleView from './ExampleView';
     * ```
     *
     * @default false
     */
    importOrderCaseInsensitive?: boolean;

    /**
     * A boolean value to enable sorting of node builtins
     * to the top of all import groups.
     *
     * @ref https://nodejs.org/api/module.html#modulebuiltinmodules
     * @default false
     */
    importOrderBuiltinModulesToTop?: boolean;

    /**
     * A boolean value to enable or disable sorting the namespace specifiers to the top of the import group.
     *
     * @default false
     */
    importOrderGroupNamespaceSpecifiers?: boolean;

    /**
     * When `true`, multiple import statements from the same module will be combined into a single import.
     *
     * @default false
     */
    importOrderMergeDuplicateImports?: boolean;

    /**
     * A boolean value to control merging `import type` expressions into `import {…}`.
     *
     * ```diff
     * - import type { C1 } from 'c';
     * - import { C2 } from 'c';
     * + import { type C1, C2 } from "c";
     *
     * - import { D1 } from 'd';
     * - import type { D2 } from 'd';
     * + import { D1, type D2 } from "d";
     *
     * - import type { A1 } from 'a';
     * - import type { A2 } from 'a';
     * + import type { A1, A2 } from "a";
     * ```
     *
     * @default false
     */
    importOrderCombineTypeAndValueImports?: boolean;

    /**
     * A boolean value to enable or disable the new line separation between sorted import declarations group.
     * The separation takes place according to the `importOrder`.
     *
     * @default false
     */
    importOrderSeparation?: boolean;

    /**
     * A boolean value to enable or disable sorting of the specifiers in an import declarations.
     *
     * @default false
     */
    importOrderSortSpecifiers?: boolean;

    /**
     * A collection of plugins for babel parser. The plugin passes this list to babel parser, so it can understand the syntaxes
     * used in the file being formatted. The plugin uses prettier itself to figure out the parser it needs to use but if that fails,
     * you can use this field to enforce the usage of the plugins' babel parser needs.
     *
     * **To pass the plugins to babel parser**:
     *
     * ```
     * "importOrderParserPlugins" : ["classProperties", "decorators-legacy"]
     * ```
     *
     * **To pass the options to the babel parser plugins**: Since prettier options are limited to string, you can pass plugins
     * with options as a JSON string of the plugin array:
     * `"[\"plugin-name\", { \"pluginOption\": true }]"`.
     *
     * ```
     * "importOrderParserPlugins" : ["classProperties", "[\"decorators\", { \"decoratorsBeforeExport\": true }]"]
     * ```
     *
     * **To disable default plugins for babel parser, pass an empty array**:
     *
     * @default ["typescript", "jsx"]
     */
    importOrderParserPlugins?: ImportOrderParserPlugin[];
}

export type PrettierConfig = PluginConfig & Config;
