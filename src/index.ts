import type {
    BooleanSupportOption,
    StringArraySupportOption,
    StringSupportOption,
} from 'prettier';
import { parsers as babelParsers } from 'prettier/parser-babel';
import { parsers as flowParsers } from 'prettier/parser-flow';
import { parsers as htmlParsers } from 'prettier/parser-html';
import { parsers as typescriptParsers } from 'prettier/parser-typescript';

import { PluginConfig } from '../types';
import { DEFAULT_IMPORT_ORDER } from './constants';
import { defaultPreprocessor } from './preprocessors/default';
import { emberPreprocessor } from './preprocessors/ember';
import { vuePreprocessor } from './preprocessors/vue';

export const options = {
    importOrder: {
        type: 'string',
        category: 'Global',
        array: true,
        default: [{ value: DEFAULT_IMPORT_ORDER }],
        description: 'An array of regex strings for the import sort order.',
    },
    importOrderParserPlugins: {
        type: 'string',
        category: 'Global',
        array: true,
        // By default, we add ts and jsx as parsers but if users define something
        // we take that option
        default: [{ value: ['typescript', 'jsx'] }],
        description: 'A list of babel parser plugins for special syntax.',
    },
    importOrderTypeScriptVersion: {
        type: 'string',
        category: 'Global',
        default: '1.0.0',
        description:
            'Version of TypeScript in use in the project.  Determines some output syntax when using TypeScript.',
    },
    importOrderCaseSensitive: {
        type: 'boolean',
        category: 'Global',
        default: false,
        description:
            'Should capitalization be considered when sorting imports?',
    },
    importOrderSafeSideEffects: {
        type: 'string',
        category: 'Global',
        array: true,
        default: [{ value: [] }],
        description:
            'Array of globs for side-effect-only imports that are considered safe to sort.',
    },
} satisfies Record<
    keyof PluginConfig,
    StringArraySupportOption | BooleanSupportOption | StringSupportOption
>;

const getEmberPlugin = () => {
    try {
        const emberPlugin = require('prettier-plugin-ember-template-tag');

        return emberPlugin;
    } catch {
        throw new Error(
            'prettier-plugin-ember-template-tag could not be loaded.  Is it installed?',
        );
    }
};

const getOxcPlugin = () => {
    try {
        const oxcPlugin = require('@prettier/plugin-oxc');

        return oxcPlugin;
    } catch {
        throw new Error(
            '@prettier/plugin-oxc could not be loaded.  Is it installed?',
        );
    }
};

export const parsers = {
    babel: {
        ...babelParsers.babel,
        preprocess: defaultPreprocessor,
    },
    'babel-ts': {
        ...babelParsers['babel-ts'],
        preprocess: defaultPreprocessor,
    },
    get 'ember-template-tag'() {
        const emberPlugin = getEmberPlugin();

        return {
            ...emberPlugin.parsers['ember-template-tag'],
            preprocess: emberPreprocessor,
        };
    },
    flow: {
        ...flowParsers.flow,
        preprocess: defaultPreprocessor,
    },
    get oxc() {
        const oxcPlugin = getOxcPlugin();

        return {
            ...oxcPlugin.parsers.oxc,
            preprocess: defaultPreprocessor,
        };
    },
    get 'oxc-ts'() {
        const oxcPlugin = getOxcPlugin();

        return {
            ...oxcPlugin.parsers['oxc-ts'],
            preprocess: defaultPreprocessor,
        };
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

export const printers = {
    get 'estree-oxc'() {
        const oxcPlugin = getOxcPlugin();

        return oxcPlugin.printers['estree-oxc'];
    },
};
