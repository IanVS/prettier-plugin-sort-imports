import type { parse as Parse } from '@vue/compiler-sfc';

import { ImportOrderParserPlugin } from '../../types';
import { PrettierOptions } from '../types';
import { hasPlugin } from '../utils/get-experimental-parser-plugins';
import { preprocessor } from './preprocessor';

export function vuePreprocessor(code: string, options: PrettierOptions) {
    let preprocessedCode = code;
    try {
        const { parse }: { parse: typeof Parse } = require('@vue/compiler-sfc');
        const { descriptor } = parse(code);

        if (descriptor.script) {
            preprocessedCode = sortScript(
                descriptor.script,
                preprocessedCode,
                options,
            );
        }

        if (descriptor.scriptSetup) {
            preprocessedCode = sortScript(
                descriptor.scriptSetup,
                preprocessedCode,
                options,
            );
        }

        return preprocessedCode;
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
            console.warn(
                '[@ianvs/prettier-plugin-sort-imports]: Could not process .vue file.  Please be sure that "@vue/compiler-sfc" is installed in your project.',
            );
            throw err;
        }
    }
}

function isTS(lang?: string) {
    return lang === 'ts' || lang === 'tsx';
}

/**
 * Configures correct babel plugins, sorts imports in a script or setupScript,
 * and replaces that script/setupScript within the original code
 *
 * Much of this was adapted from https://github.com/vuejs/vue/blob/49b6bd4264c25ea41408f066a1835f38bf6fe9f1/packages/compiler-sfc/src/compileScript.ts#L118-L134
 *
 * @param param0 a script or setupScript
 * @param code Source code of the file
 * @param options Prettier options
 * @returns Original code with sorted imports in the script provided
 */
function sortScript(
    { content, lang }: { content: string; lang?: string },
    code: string,
    options: PrettierOptions,
) {
    const { importOrderParserPlugins = [] } = options;
    let pluginClone = [...importOrderParserPlugins];
    const newPlugins: ImportOrderParserPlugin[] = [];

    if (!isTS(lang) || lang === 'tsx') {
        newPlugins.push('jsx');
    } else {
        // Remove jsx if typescript and not tsx
        pluginClone = pluginClone.filter((p) => p !== 'jsx');
    }

    newPlugins.push(...pluginClone);

    if (isTS(lang)) {
        if (!hasPlugin(newPlugins, 'typescript')) {
            newPlugins.push('typescript');
        }

        if (
            !hasPlugin(newPlugins, 'decorators') &&
            !hasPlugin(newPlugins, 'decorators-legacy')
        ) {
            newPlugins.push('decorators-legacy');
        }
    }

    const adjustedOptions = {
        ...options,
        importOrderParserPlugins: newPlugins,
    };

    return code.replace(
        content,
        `\n${preprocessor(content, adjustedOptions)}\n`,
    );
}
