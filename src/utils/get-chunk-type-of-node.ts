import { ImportDeclaration } from '@babel/types';

import { chunkTypeOther, chunkTypeUnsortable } from '../constants';
import { GetChunkTypeOfNode } from '../types';

/**
 * Classifies an import declarations according to its properties, the
 * surrounding comments and possibly the plugin's settings.
 *
 * Nodes are only sorted within the same chunk, but different chunks keep
 * their relative order. This is used, e.g., to keep the order of side-effect
 * imports.
 *
 * The classification is done as follows:
 * - If the node is a side-effect node (i.e. provides no symbols to the module
 * scope), classify the node as `unsortable`.
 * - Otherwise, if the node is preceded by a comment exactly equal (up to
 * leading and trailing spaces) the string `prettier-ignore`, classify the node
 * as `unsortable`.
 * - Otherwise, if the node is within a range of lines delimited by the start
 * comment `prettier-ignore-start` and the end comment `prettier-ignore-end`,
 * classify the node as `unsortable`.
 * - Otherwise, classify the node as `sortable`.
 * @param node An import declaration node to classify.
 * @param rangeIgnoredLines Index of lines which are within an ignored range.
 * @returns The type of the chunk into which the node should be put.
 */
export const getChunkTypeOfNode: GetChunkTypeOfNode = (
    node,
    rangeIgnoredLines,
) => {
    const hasIgnoreNextNode = (node.leadingComments ?? []).some(
        (comment) => comment.value.trim() === 'prettier-ignore',
    );
    const hasNoImportedSymbols = node.specifiers.length === 0;
    const isWithinIgnoredRange = rangeIgnoredLines.has(
        node.loc?.start.line ?? -1,
    );
    return hasIgnoreNextNode || isWithinIgnoredRange || hasNoImportedSymbols
        ? chunkTypeUnsortable
        : chunkTypeOther;
};
