import { type ImportDeclaration } from '@babel/types';

import { naturalSort } from '../natural-sort';

/**
 * This function returns import nodes with alphabetically sorted module
 * specifiers.
 *
 * type imports are sorted separately, and placed after value imports.
 *
 * Comments need to be fixed up so they attach to the right objects.
 *
 * @param node Import declaration node
 */
export const getSortedImportSpecifiers = (node: ImportDeclaration) => {
    node.specifiers.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'ImportDefaultSpecifier' ? -1 : 1;
        }
        if (
            a.type === 'ImportSpecifier' &&
            b.type === 'ImportSpecifier' &&
            a.importKind !== b.importKind
        ) {
            // flow uses null for value import specifiers
            return a.importKind === 'value' || a.importKind == null ? -1 : 1;
        }

        return naturalSort(a.local.name, b.local.name);
    });
    return node;
};
