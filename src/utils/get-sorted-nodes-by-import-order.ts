import { clone } from 'lodash';

import {
    BUILTIN_MODULES,
    THIRD_PARTY_MODULES_SPECIAL_WORD,
    newLineNode,
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
    naturalSort.insensitive = options.importOrderCaseInsensitive;

    let { importOrder } = options;
    const {
        importOrderSeparation,
        importOrderSortSpecifiers,
        importOrderGroupNamespaceSpecifiers,
        importOrderBuiltinModulesToTop,
    } = options;

    const originalNodes = nodes.map(clone);
    const finalNodes: ImportOrLine[] = [];

    if (!importOrder.includes(THIRD_PARTY_MODULES_SPECIAL_WORD)) {
        importOrder = [THIRD_PARTY_MODULES_SPECIAL_WORD, ...importOrder];
    }

    if (importOrderBuiltinModulesToTop) {
        importOrder = [BUILTIN_MODULES, ...importOrder];
    }

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

        if (importOrderSeparation) {
            finalNodes.push(newLineNode);
        }
    }

    return finalNodes;
};

/**
 * isCustomGroupSeparator checks if the provided pattern is intended to be used
 * as an import separator, rather than an actual group of imports.
 */
function isCustomGroupSeparator(pattern: string) {
    return pattern.trim() === '';
}
