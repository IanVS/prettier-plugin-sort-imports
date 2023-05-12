import { parse as babelParser } from '@babel/parser';
import { format } from 'prettier';
import { expect, test } from 'vitest';

import { getAllCommentsFromNodes } from '../get-all-comments-from-nodes';
import { getImportNodes } from '../get-import-nodes';
import { getSortedNodes } from '../get-sorted-nodes';
import { removeNodesFromOriginalCode } from '../remove-nodes-from-original-code';

const code = `"some directive";// first comment
// second comment
import z from 'z';
import c from 'c';
import g from 'g';
import t from 't';
import k from 'k';
// import a from 'a';
  // import a from 'a';
import a from 'a';
`;

test('it should remove nodes from the original code', async () => {
    const ast = babelParser(code, { sourceType: 'module' });
    const importNodes = getImportNodes(code);
    const sortedNodes = getSortedNodes(importNodes, {
        importOrder: [],
        importOrderCombineTypeAndValueImports: true,
    });
    const allCommentsFromImports = getAllCommentsFromNodes(sortedNodes);

    const commentAndImportsToRemoveFromCode = [
        ...sortedNodes,
        ...allCommentsFromImports,
        ...ast.program.directives,
    ];
    const codeWithoutImportDeclarations = removeNodesFromOriginalCode(
        code,
        commentAndImportsToRemoveFromCode,
    );
    const result = await format(codeWithoutImportDeclarations, {
        parser: 'babel',
    });
    expect(result).toEqual('');
});
