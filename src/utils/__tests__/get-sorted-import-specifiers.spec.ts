import type { NaturalSortOptions } from '../../natural-sort';
import { getImportNodes } from '../get-import-nodes';
import { getSortedImportSpecifiers } from '../get-sorted-import-specifiers';
import { getSortedNodesModulesNames } from '../get-sorted-nodes-modules-names';

const defaultSortOptions: NaturalSortOptions = {
    importOrderCaseInsensitive: false,
};
it('should return correct sorted nodes', () => {
    const code = `import { filter, reduce, eventHandler } from '@server/z';`;
    const [importNode] = getImportNodes(code);
    const sortedImportSpecifiers = getSortedImportSpecifiers(
        importNode,
        defaultSortOptions,
    );
    const specifiersList = getSortedNodesModulesNames(
        sortedImportSpecifiers.specifiers,
    );

    expect(specifiersList).toEqual(['eventHandler', 'filter', 'reduce']);
});

it('should return correct sorted nodes with default import', () => {
    const code = `import Component, { filter, reduce, eventHandler } from '@server/z';`;
    const [importNode] = getImportNodes(code);
    const sortedImportSpecifiers = getSortedImportSpecifiers(
        importNode,
        defaultSortOptions,
    );
    const specifiersList = getSortedNodesModulesNames(
        sortedImportSpecifiers.specifiers,
    );

    expect(specifiersList).toEqual([
        'Component',
        'eventHandler',
        'filter',
        'reduce',
    ]);
});
