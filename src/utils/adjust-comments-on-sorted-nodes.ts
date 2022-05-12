import { ImportDeclaration, addComments, removeComments } from '@babel/types';
import { clone, isEqual } from 'lodash';

import { ImportOrLine } from '../types';

/**
 * Takes the original nodes before sorting and the final nodes after sorting.
 * Adjusts the comments on the final nodes so that they match the comments as
 * they were in the original nodes.
 * @param nodes A list of nodes in the order as they were originally.
 * @param finalNodes The same set of nodes, but in the final sorting order.
 * @returns A copied and adjusted set of nodes, containing comments
 */
export const adjustCommentsOnSortedNodes = (
    nodes: ImportDeclaration[],
    finalNodes: ImportOrLine[],
) => {
    // We will mutate a copy of the finalNodes, and extract comments from the original
    const finalNodesClone = finalNodes.map(clone);

    const firstNodesComments = nodes[0].leadingComments;

    // Remove all comments from sorted nodes
    finalNodesClone.forEach(removeComments);

    // insert comments other than the first comments
    finalNodesClone.forEach((node, index) => {
        if (isEqual(nodes[0].loc, node.loc)) return;

        addComments(node, 'leading', finalNodes[index].leadingComments || []);
    });

    if (firstNodesComments) {
        addComments(finalNodesClone[0], 'leading', firstNodesComments);
    }

    return finalNodesClone;
};
