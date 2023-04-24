import type { RequiredOptions as PrettierRequiredOptions } from 'prettier';
import { parsers as babelParsers } from 'prettier/parser-babel';
import { parsers as flowParsers } from 'prettier/parser-flow';
import { parsers as htmlParsers } from 'prettier/parser-html';
import { parsers as typescriptParsers } from 'prettier/parser-typescript';

import { defaultPreprocessor } from './preprocessors/default';
import { vuePreprocessor } from './preprocessors/vue';
import type { PrettierOptions } from './types';

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
        default: [{ value: [] }],
        description: 'Provide an order to sort imports.',
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
    importOrderCombineTypeAndValueImports: {
        type: 'boolean',
        category: 'Global',
        default: true,
        description:
            'Should import-type expressions be merged into import-value expressions?',
    },
};

export const parsers = {
    babel: {
        ...babelParsers.babel,
        preprocess: defaultPreprocessor,
    },
    flow: {
        ...flowParsers.flow,
        preprocess: defaultPreprocessor,
    },
    typescript: {
        ...typescriptParsers.typescript,
        preprocess: defaultPreprocessor,
    },
    vue: {
        ...htmlParsers.vue,
        preprocess: vuePreprocessor,
    },
};
