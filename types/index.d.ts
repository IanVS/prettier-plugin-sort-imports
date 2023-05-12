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
     *
     */
    importOrderTypeScriptVersion?: string;

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
