import type { ImportDeclaration } from '@babel/types';

import type { PluginConfig } from '../../types';
import { naturalSort, naturalSortCaseSensitive } from '../natural-sort';

export const getSortedNodesGroup = (
    imports: ImportDeclaration[],
    options?: Pick<PluginConfig, 'importOrderCaseSensitive'>,
) => {
    const { importOrderCaseSensitive } = options || {};
    const sortFn = importOrderCaseSensitive
        ? naturalSortCaseSensitive
        : naturalSort;
    return imports.sort((a, b) => sortFn(a.source.value, b.source.value));
};
