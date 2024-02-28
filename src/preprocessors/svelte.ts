import { PrettierOptions } from '../types';
import { preprocessor } from './preprocessor';

/**
 * NOTE(secondfry): stolen from `svelte/src/compiler/preprocess/index.js`
 * @see https://github.com/sveltejs/svelte/blob/main/packages/svelte/src/compiler/preprocess/index.js#L252-L253
 */
const regex_script_tags =
	/<!--[^]*?-->|<script((?:\s+[^=>'"\/]+=(?:"[^"]*"|'[^']*'|[^>\s]+)|\s+[^=>'"\/]+)*\s*)(?:\/>|>([\S\s]*?)<\/script>)/g;

const sortImports = (code: string, options: PrettierOptions) => {
    const matches = [...code.matchAll(regex_script_tags)];
    if (!matches.length) return code;
    return matches.reduce((code, [match, attributes, snippet]) => {
        const preprocessed = preprocessor(snippet, options);
        const result = code.replace(snippet, `\n${preprocessed}\n`);
        return result;
    }, code);
};

export function sveltePreprocessor(code: string, options: PrettierOptions) {
    try {
        const sorted = sortImports(code, options);
        const prettierPluginSvelte = require('prettier-plugin-svelte');
        const mutated = prettierPluginSvelte.parsers.svelte.preprocess(sorted, options);
        return mutated;
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
            console.warn(
                '[@ianvs/prettier-plugin-sort-imports]: Could not process .svelte file.  Please be sure that "prettier-plugin-svelte" are installed in your project.',
            );
            throw err;
        }
    }
}
