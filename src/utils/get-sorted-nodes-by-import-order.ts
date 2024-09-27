import { newLineNode, THIRD_PARTY_MODULES_SPECIAL_WORD } from '../constants';
import type {
    GetSortedNodesByImportOrder,
    ImportGroups,
    ImportOrLine,
} from '../types';
import { getImportNodesMatchedGroup } from './get-import-nodes-matched-group';
import { getSortedImportSpecifiers } from './get-sorted-import-specifiers';
import { getSortedNodesGroup } from './get-sorted-nodes-group';
import {
    isCustomGroupSeparator,
    testingOnly,
} from './normalize-plugin-options';

/**
 * This function returns the given nodes, sorted in the order as indicated by
 * the importOrder array from the given options.
 * The plugin considers these import nodes as local import declarations.
 * @param originalNodes A subset (of all import nodes) that should be sorted.
 * @param options Options to influence the behavior of the sorting algorithm.
 */
export const getSortedNodesByImportOrder: GetSortedNodesByImportOrder = (
    originalNodes,
    { importOrder, importOrderCaseSensitive },
) => {
    if (
        process.env.NODE_ENV === 'test' &&
        JSON.stringify(importOrder) !==
            JSON.stringify(testingOnly.normalizeImportOrderOption(importOrder))
    ) {
        throw new Error(
            'API Misuse: getSortedNodesByImportOrder::importOrder option already should be normalized.',
        );
    }

    const finalNodes: ImportOrLine[] = [];

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

    // Select just the SPECIAL WORDS and the matchers
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
            importOrderCaseSensitive,
        });

        // Sort the import specifiers
        sortedInsideGroup.forEach((node) =>
            getSortedImportSpecifiers(node, { importOrderCaseSensitive }),
        );

        finalNodes.push(...sortedInsideGroup);
    }

    return finalNodes;
};

function isNodeANewline(node: ImportOrLine) {
    return node.type === 'ExpressionStatement';
}
