import { ImportDeclaration } from '@babel/types';

import { NaturalSortOptions, naturalSort } from '../natural-sort';

/**
 * This function returns import nodes with alphabetically sorted module
 * specifiers
 * @param node Import declaration node
 */
export const getSortedImportSpecifiers = (
    node: ImportDeclaration,
    options: NaturalSortOptions,
) => {
    node.specifiers.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'ImportDefaultSpecifier' ? -1 : 1;
        }

        return naturalSort(a.local.name, b.local.name, options);
    });
    return node;
};
