import { ExpressionStatement, ImportDeclaration } from '@babel/types';

/**
 * Test helper, to verify sort order and newline placement
 */
export const getSortedNodesNamesAndNewlines = (
    imports: (ImportDeclaration | ExpressionStatement)[],
) =>
    imports
        .filter(
            (i) =>
                i.type === 'ImportDeclaration' ||
                i.type === 'ExpressionStatement',
        )
        .map((i) => {
            if (i.type === 'ImportDeclaration') {
                return i.source.value;
            } else {
                return '';
            }
        });
