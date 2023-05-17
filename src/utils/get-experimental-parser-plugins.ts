import type { ParserPlugin, ParserPluginWithOptions } from '@babel/parser';

/**
 * Returns a list of babel parser plugin names
 * @param importOrderParserPlugins array of experimental babel parser plugins
 * @returns list of parser plugins to be passed to babel parser
 */
export const getExperimentalParserPlugins = (
    importOrderParserPlugins: string[],
): ParserPlugin[] => {
    return importOrderParserPlugins.map((pluginNameOrJson) => {
        // ParserPlugin can be either a string or and array of [name: string, options: object]
        // in prettier options the array will be sent in a JSON string
        const isParserPluginWithOptions = pluginNameOrJson.startsWith('[');

        let plugin;
        if (isParserPluginWithOptions) {
            try {
                plugin = JSON.parse(
                    pluginNameOrJson,
                ) as ParserPluginWithOptions;
            } catch (e) {
                throw Error(
                    'Invalid JSON in importOrderParserPlugins: ' +
                        pluginNameOrJson,
                );
            }
        } else {
            plugin = pluginNameOrJson as ParserPlugin;
        }

        return plugin;
    });
};

/**
 * Checks whether a specified plugin is included in importOrderParserPlugins.
 * More fancy than just a `.includes()` because importOrderParserPlugins can contain plugins with configuration
 *
 * @param importOrderParserPlugins array of experimental babel parser plugins
 * @returns true if the plugin is in the list
 */
export const hasPlugin = (
    importOrderParserPlugins: string[],
    pluginName: string,
): boolean => {
    for (const pluginNameOrJson of importOrderParserPlugins) {
        const isParserPluginWithOptions = pluginNameOrJson.startsWith('[');
        let plugin;

        if (isParserPluginWithOptions) {
            try {
                plugin = JSON.parse(pluginNameOrJson)[0];
            } catch (e) {
                throw Error(
                    'Invalid JSON in importOrderParserPlugins: ' +
                        pluginNameOrJson,
                );
            }
        } else {
            plugin = pluginNameOrJson as ParserPlugin;
        }
        if (plugin === pluginName) return true;
    }
    return false;
};
