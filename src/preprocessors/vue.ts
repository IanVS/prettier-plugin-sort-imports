import type { SFCDescriptor } from '@vue/compiler-sfc';

import { ImportOrderParserPlugin } from '../../types';
import { PrettierOptions } from '../types';
import { hasPlugin } from '../utils/get-experimental-parser-plugins';
import { preprocessor } from './preprocessor';

// Non-exhaustive, describes just the properties needed for type guarding
type BaseBlock = { start: { offset: number }; end: { offset: number } };
type LocBlock = { loc: BaseBlock };
type VueBlock = BaseBlock | LocBlock;

export function vuePreprocessor(code: string, options: PrettierOptions) {
    try {
        const { parse } = require('@vue/compiler-sfc');
        const version =
            require('@vue/compiler-sfc/package.json').version?.split('.')[0];
        const descriptor: SFCDescriptor =
            version === '2' ? parse({ source: code }) : parse(code).descriptor;

        // 1. Filter valid blocks.
        const blocks = [descriptor.script, descriptor.scriptSetup].filter(
            (block): block is NonNullable<typeof descriptor.script> =>
                Boolean(block?.content),
        );
        if (!blocks.length) {
            return code;
        }

        // 2. Sort blocks by start offset.
        blocks.sort((a: VueBlock, b: VueBlock) => {
            const startA = isLocBlock(a) ? a.loc.start : a.start;
            const startB = isLocBlock(b) ? b.loc.start : b.start;
            return startA.offset - startB.offset;
        });

        // 3. Replace blocks.
        // Using offsets to avoid string replace catching the wrong place and improve efficiency
        // see https://github.com/IanVS/prettier-plugin-sort-imports/pull/90
        let offset = 0;
        let result = '';
        for (const block of blocks) {
            // https://github.com/vuejs/core/blob/b8fc18c0b23be9a77b05dc41ed452a87a0becf82/packages/compiler-core/src/ast.ts#L74-L80
            // The node's range. The `start` is inclusive and `end` is exclusive.
            // [start, end)

            const start = isLocBlock(block)
                ? block.loc.start.offset
                : (block as BaseBlock).start.offset;
            const end = isLocBlock(block)
                ? block.loc.end.offset
                : (block as BaseBlock).end.offset;
            const preprocessedBlockCode = sortScript(block, options);
            result += code.slice(offset, start) + preprocessedBlockCode;
            offset = end;
        }

        // 4. Append the rest.
        result += code.slice(offset);
        return result;
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
            console.warn(
                '[@ianvs/prettier-plugin-sort-imports]: Could not process .vue file.  Please be sure that "@vue/compiler-sfc" is installed in your project.',
            );
        }
        throw err;
    }
}

/**
 * Some Vue versions have the start/end offsets under a `block.loc`, others have them directly on the block
 */
function isLocBlock(b: VueBlock): b is LocBlock {
    return 'loc' in b;
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
 * @param param0 A script or setupScript block of the SFC
 * @param options Prettier options
 * @returns Original code with sorted imports in the block provided
 */
function sortScript(
    { content, lang }: { content: string; lang?: string },
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
    }

    const adjustedOptions = {
        ...options,
        importOrderParserPlugins: newPlugins,
    };

    return `\n${preprocessor(content, { options: adjustedOptions })}\n`;
}
