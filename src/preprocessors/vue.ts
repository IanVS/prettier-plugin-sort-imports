import type { parse as Parse } from '@vue/compiler-sfc';

import { PrettierOptions } from '../types';
import { preprocessor } from './preprocessor';

export function vuePreprocessor(code: string, options: PrettierOptions) {
    let preprocessedCode = code;
    try {
        const { parse }: { parse: typeof Parse } = require('@vue/compiler-sfc');
        const { descriptor } = parse(code);

        if (descriptor.script) {
            const { content } = descriptor.script;
            preprocessedCode = preprocessedCode.replace(
                content,
                `\n${preprocessor(content, options)}\n`,
            );
        }

        if (descriptor.scriptSetup) {
            const { content } = descriptor.scriptSetup;
            preprocessedCode = preprocessedCode.replace(
                content,
                `\n${preprocessor(content, options)}\n`,
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
