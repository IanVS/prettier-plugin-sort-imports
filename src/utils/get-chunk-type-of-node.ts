import { ImportDeclaration } from '@babel/types';

import { chunkTypeOther, chunkTypeUnsortable } from '../constants';
import { ExtendedOptions } from '../types';
import { hasIgnoreNextNode } from './has-ignore-next-node';

const regexCache = new Map<string, RegExp>();
const cachedRegExp = (regExp: string) => {
    if (regexCache.has(regExp)) {
        return regexCache.get(regExp)!;
    }
    const result = new RegExp(regExp);
    regexCache.set(regExp, result);
    return result;
};

/**
 * Classifies an import declaration according to its properties, the
 * surrounding comments and the plugin's importOrderSafeSideEffects setting.
 *
 * Nodes are only sorted within the same chunk, but different chunks keep
 * their relative order. This is used, e.g., to keep the order of side-effect
 * imports (unless they match a regex in `importOrderSafeSideEffects`).
 *
 * The classification is done as follows:
 * - If the node is a side-effect node (i.e. provides no symbols to the module
 * scope), check whether it matches a regex pattern provided by `importOrderSafeSideEffects`:
 *   - If so, classify the node as `other`, and if not, as `unsortable`.
 * - Otherwise, if the node is preceded by a comment exactly equal (up to
 * leading and trailing spaces) the string `prettier-ignore`, classify the node
 * as `unsortable`.
 * - Otherwise, classify the node as `other`.
 * @param node An import declaration node to classify.
 * @param importOrderSafeSideEffects An array of regex patterns to consider "safe" side-effect imports.
 * @returns The type of the chunk into which the node should be put.
 */
export const getChunkTypeOfNode = (
    node: ImportDeclaration,
    importOrderSafeSideEffects: ExtendedOptions['importOrderSafeSideEffects'],
) => {
    let isSafe = false;
    const hasNoImportedSymbols = node.specifiers.length === 0;
    const isIgnored = hasIgnoreNextNode(node.leadingComments);

    if (hasNoImportedSymbols) {
        isSafe = importOrderSafeSideEffects.some(
            (regex) => node.source.value.match(cachedRegExp(regex)) !== null,
        );
    }

    return isIgnored || (hasNoImportedSymbols && !isSafe)
        ? chunkTypeUnsortable
        : chunkTypeOther;
};
