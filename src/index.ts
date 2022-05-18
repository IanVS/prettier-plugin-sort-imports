import type { RequiredOptions as PrettierRequiredOptions } from 'prettier';
import { parsers as babelParsers } from 'prettier/parser-babel';
import { parsers as flowParsers } from 'prettier/parser-flow';
import { parsers as typescriptParsers } from 'prettier/parser-typescript';

import { preprocessor } from './preprocessor';
import type { PrettierOptions } from './types';

// Not sure what the type from Prettier should be, but this is a good enough start.
interface PrettierOptionSchema {
    type: string;
    category: 'Global';
    array?: boolean;
    default: unknown;
    description: string;
}

const options: Record<
    Exclude<keyof PrettierOptions, keyof PrettierRequiredOptions>,
    PrettierOptionSchema
> = {
    importOrder: {
        type: 'path',
        category: 'Global',
        array: true,
        default: [{ value: [] }],
        description: 'Provide an order to sort imports.',
    },
    importOrderCaseInsensitive: {
        type: 'boolean',
        category: 'Global',
        default: false,
        description: 'Provide a case sensitivity boolean flag',
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
    importOrderSeparation: {
        type: 'boolean',
        category: 'Global',
        default: false,
        description: 'Should imports be separated by new line?',
    },
    importOrderGroupNamespaceSpecifiers: {
        type: 'boolean',
        category: 'Global',
        default: false,
        description:
            'Should namespace specifiers be grouped at the top of their group?',
    },
    importOrderSortSpecifiers: {
        type: 'boolean',
        category: 'Global',
        default: false,
        description: 'Should specifiers be sorted?',
    },
    importOrderBuiltinModulesToTop: {
        type: 'boolean',
        category: 'Global',
        default: false,
        description: 'Should node-builtins be hoisted to the top?',
    },
};

module.exports = {
    parsers: {
        babel: {
            ...babelParsers.babel,
            preprocess: preprocessor,
        },
        flow: {
            ...flowParsers.flow,
            preprocess: preprocessor,
        },
        typescript: {
            ...typescriptParsers.typescript,
            preprocess: preprocessor,
        },
    },
    options,
};
