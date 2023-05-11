import {
    addComments,
    removeComments,
    type ImportDeclaration,
} from '@babel/types';

import { ImportOrLine } from '../types';
import {
    attachCommentsToOutputNodes,
    getCommentRegistryFromImportDeclarations,
} from './get-comment-registry';

/**
 * Takes the original nodes before sorting and the final nodes after sorting.
 * Adjusts the comments on the final nodes so that they match the comments as
 * they were in the original nodes.
 * @param originalDeclarationNodes A list of nodes in the order as they were originally.
 * @param finalNodes The same set of nodes, but in the final sorting order.
 * @returns A copied and adjusted set of nodes, containing comments
 */
export const adjustCommentsOnSortedNodes = (
    originalDeclarationNodes: ImportDeclaration[],
    finalNodes: ImportOrLine[],
) => {

    const outputDeclarationNodes: ImportDeclaration[] = finalNodes.filter(
        (n) => n.type === 'ImportDeclaration',
    ) as ImportDeclaration[];

    const registry = getCommentRegistryFromImportDeclarations(
        outputDeclarationNodes,
        originalDeclarationNodes[0],
    );

    // Make a copy of the nodes for easier debugging & remove the existing comments to reattach them
    // (removeComments clones the nodes internally, so we don't need to do that ourselves)
    const finalNodesClone = finalNodes.map((n) => {
        const noDirectCommentsNode = removeComments(n);
        if (noDirectCommentsNode.type === 'ImportDeclaration') {
            // Remove comments isn't recursive, so we need to clone/modify the specifiers manually
            noDirectCommentsNode.specifiers = (
                noDirectCommentsNode.specifiers || []
            ).map((s) => removeComments(s));
        }
        return noDirectCommentsNode;

    });

    attachCommentsToOutputNodes(registry, finalNodesClone);

    return finalNodesClone;
};
