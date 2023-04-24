import type { ImportDeclaration } from '@babel/types';

import { naturalSort } from '../natural-sort';
import type { PrettierOptions } from '../types';

export const getSortedNodesGroup = (
    imports: ImportDeclaration[],
    options: Pick<
        PrettierOptions,
        'importOrderGroupNamespaceSpecifiers'
    >,
) => {
    return imports.sort((a, b) => {
        if (options.importOrderGroupNamespaceSpecifiers) {
            const diff = namespaceSpecifierSort(a, b);
            if (diff !== 0) return diff;
        }

        return naturalSort(a.source.value, b.source.value, options);
    });
};

function namespaceSpecifierSort(a: ImportDeclaration, b: ImportDeclaration) {
    const aFirstSpecifier = a.specifiers.find(
        (s) => s.type === 'ImportNamespaceSpecifier',
    )
        ? 1
        : 0;
    const bFirstSpecifier = b.specifiers.find(
        (s) => s.type === 'ImportNamespaceSpecifier',
    )
        ? 1
        : 0;
    return bFirstSpecifier - aFirstSpecifier;
}
