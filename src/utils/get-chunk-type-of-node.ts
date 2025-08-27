import { ImportDeclaration } from '@babel/types';

import { chunkTypeOther, chunkTypeUnsortable } from '../constants';
import { hasIgnoreNextNode } from './has-ignore-next-node';

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
 * - Otherwise, classify the node as `sortable`.
 * @param node An import declaration node to classify.
 * @returns The type of the chunk into which the node should be put.
 */
export const getChunkTypeOfNode = (node: ImportDeclaration) => {
    const hasNoImportedSymbols = node.specifiers.length === 0;
    return hasIgnoreNextNode(node.leadingComments) || hasNoImportedSymbols
        ? chunkTypeUnsortable
        : chunkTypeOther;
};
