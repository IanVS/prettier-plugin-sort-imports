import clone from 'lodash.clone';

import {
    BUILTIN_MODULES,
    newLineNode,
    THIRD_PARTY_MODULES_SPECIAL_WORD,
} from '../constants';
import { naturalSort } from '../natural-sort';
import { GetSortedNodes, ImportGroups, ImportOrLine } from '../types';
import { getImportNodesMatchedGroup } from './get-import-nodes-matched-group';
import { getSortedImportSpecifiers } from './get-sorted-import-specifiers';
import { getSortedNodesGroup } from './get-sorted-nodes-group';

/**
 * This function returns the given nodes, sorted in the order as indicated by
 * the importOrder array from the given options.
 * The plugin considers these import nodes as local import declarations.
 * @param nodes A subset of all import nodes that should be sorted.
 * @param options Options to influence the behavior of the sorting algorithm.
 */
export const getSortedNodesByImportOrder: GetSortedNodes = (nodes, options) => {
    naturalSort.insensitive = true;

    let { importOrder } = options;
    const { importOrderSortSpecifiers, importOrderGroupNamespaceSpecifiers } =
        options;

    const originalNodes = nodes.map(clone);
    const finalNodes: ImportOrLine[] = [];

    if (!importOrder.includes(THIRD_PARTY_MODULES_SPECIAL_WORD)) {
        importOrder = [THIRD_PARTY_MODULES_SPECIAL_WORD, ...importOrder];
    }

    // IDEA: We could make built-ins a special word, if people do not want them up top
    importOrder = [BUILTIN_MODULES, ...importOrder];

    const importOrderGroups = importOrder.reduce<ImportGroups>(
        (groups, regexp) =>
            // Don't create a new group for explicit import separators
            isCustomGroupSeparator(regexp)
                ? groups
                : {
                      ...groups,
                      [regexp]: [],
                  },
        {},
    );

    const sanitizedImportOrder = importOrder.filter(
        (group) =>
            !isCustomGroupSeparator(group) &&
            group !== THIRD_PARTY_MODULES_SPECIAL_WORD,
    );

    // Assign import nodes into import order groups
    for (const node of originalNodes) {
        const matchedGroup = getImportNodesMatchedGroup(
            node,
            sanitizedImportOrder,
        );
        importOrderGroups[matchedGroup].push(node);
    }

    for (const group of importOrder) {
        // If it's a custom separator, all we need to do is add a newline
        if (isCustomGroupSeparator(group)) {
            const lastNode = finalNodes[finalNodes.length - 1];
            // Avoid empty new line if first group is empty
            if (!lastNode) {
                continue;
            }
            // Don't add multiple newlines
            if (isNodeANewline(lastNode)) {
                continue;
            }
            finalNodes.push(newLineNode);
            continue;
        }

        const groupNodes = importOrderGroups[group];

        if (groupNodes.length === 0) continue;

        const sortedInsideGroup = getSortedNodesGroup(groupNodes, {
            importOrderGroupNamespaceSpecifiers,
        });

        // Sort the import specifiers
        if (importOrderSortSpecifiers) {
            sortedInsideGroup.forEach((node) =>
                getSortedImportSpecifiers(node),
            );
        }

        finalNodes.push(...sortedInsideGroup);
    }

    return finalNodes;
};

/**
 * isCustomGroupSeparator checks if the provided pattern is intended to be used
 * as an import separator, rather than an actual group of imports.
 */
export function isCustomGroupSeparator(pattern?: string) {
    return pattern?.trim() === '';
}

function isNodeANewline(node: ImportOrLine) {
    return node.type === 'ExpressionStatement';
}
