import type {
    Parser,
    ParserOptions,
    Plugin,
    RequiredOptions as PrettierRequiredOptions,
} from 'prettier';
import { parsers as babelParsers } from 'prettier/parser-babel';
import { parsers as flowParsers } from 'prettier/parser-flow';
import { parsers as htmlParsers } from 'prettier/parser-html';
import { parsers as typescriptParsers } from 'prettier/parser-typescript';

import {
    BUILTIN_MODULES_SPECIAL_WORD,
    DEFAULT_IMPORT_ORDER,
    THIRD_PARTY_MODULES_SPECIAL_WORD,
} from './constants';
import { defaultPreprocessor } from './preprocessors/default';
import { vuePreprocessor } from './preprocessors/vue';
import type { PreprocessorOptions, PrettierOptions } from './types';

type ImportOrderPreprocessor = (
    code: string,
    options: PreprocessorOptions,
) => string;

// Not sure what the type from Prettier should be, but this is a good enough start.
interface PrettierOptionSchema {
    type: string;
    category: 'Global';
    array?: boolean;
    default: unknown;
    description: string;
}

export const options: Record<
    Exclude<keyof PrettierOptions, keyof PrettierRequiredOptions>,
    PrettierOptionSchema
> = {
    importOrder: {
        type: 'path',
        category: 'Global',
        array: true,
        default: [{ value: DEFAULT_IMPORT_ORDER }],
        description:
            'Provide an order to sort imports. [node.js built-ins are always first]',
    },
    importOrderParserPlugins: {
        type: 'path',
        category: 'Global',
        array: true,
        // By default, we add ts and jsx as parsers but if users define something
        // we take that option
        default: [{ value: ['typescript', 'jsx'] }],
        description: 'Provide a list of plugins for special syntax',
    },
    importOrderTypeScriptVersion: {
        type: 'string',
        category: 'Global',
        default: '1.0.0',
        description:
            'Version of TypeScript in use in the project.  Determines some output syntax when using TypeScript.',
    },
};

export const parsers = {
    babel: mergePreprocessors(babelParsers.babel, defaultPreprocessor, 'babel'),
    'babel-ts': mergePreprocessors(
        babelParsers['babel-ts'],
        defaultPreprocessor,
        'babel-ts',
    ),
    flow: mergePreprocessors(flowParsers.flow, defaultPreprocessor, 'flow'),
    typescript: mergePreprocessors(
        typescriptParsers.typescript,
        defaultPreprocessor,
        'typescript',
    ),
    vue: mergePreprocessors(htmlParsers.vue, vuePreprocessor, 'vue'),
};

// Not officially part of prettier plugin interface, but it's helpful to sort out ourselves in `findPluginByParser`
export const name = '@ianvs/prettier-plugin-sort-imports';

function mergePreprocessors(
    prettierParser: Parser,
    customPreprocessor: ImportOrderPreprocessor,
    parserName: string,
) {
    // Find preprocessors in other plugins and apply them.
    const importOrderPreprocess = (
        text: string,
        options: PreprocessorOptions,
    ) => {
        const otherParser = findPluginByParser(parserName, options);
        if (!otherParser) {
            return customPreprocessor(text, options);
        }
        const otherProcessedText = otherParser.preprocess
            ? otherParser.preprocess(text, options)
            : text;

        Object.assign(parser, {
            ...parser,
            ...otherParser,
            preprocess: importOrderPreprocess,
        });

        return customPreprocessor(otherProcessedText, options);
    };

    const parser = {
        ...prettierParser,
        preprocess: importOrderPreprocess,
    };

    return parser;
}

// Given a particular parser name, look through the options and see if any of the plugins specified
// contain a parser for that name.  If so, use that, otherwise, return undefined.
const findPluginByParser = (
    parserName: string,
    options: PreprocessorOptions,
) => {
    // Iterate backwards so we don't get the default parsers
    const otherPlugin = options.plugins.findLast((plugin): plugin is Plugin => {
        return (
            typeof plugin === 'object' &&
            (!('name' in plugin) ||
                plugin.name !== '@ianvs/prettier-plugin-sort-imports') &&
            'parsers' in plugin &&
            typeof plugin.parsers === 'object' &&
            parserName in plugin.parsers
        );
    });

    return otherPlugin?.parsers?.[parserName];
};
