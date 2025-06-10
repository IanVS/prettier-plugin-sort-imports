import type { ImportDeclaration } from '@babel/types';

import type { PluginConfig } from '../../types';
import {
    naturalSort,
    sortByLineCount,
    naturalSortCaseSensitive,
} from '../natural-sort';

export const getSortedNodesGroup = (
    imports: ImportDeclaration[],
    options?: Pick<
        PluginConfig,
        'importOrderCaseSensitive' | 'importOrderSortByLength'
    >,
) => {
    const { importOrderCaseSensitive, importOrderSortByLength } = options || {};
    if (importOrderSortByLength) {
        // Sort by line count if the option is enabled
        return imports.sort((a, b) => sortByLineCount(a, b));
    }
    const sortFn = importOrderCaseSensitive
        ? naturalSortCaseSensitive
        : naturalSort;
    return imports.sort((a, b) => sortFn(a.source.value, b.source.value));
};
