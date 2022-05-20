import { format } from 'prettier';

import { getCodeFromAst } from '../get-code-from-ast';
import { getImportNodes } from '../get-import-nodes';
import { getSortedNodes } from '../get-sorted-nodes';

it('sorts imports correctly', () => {
    const code = `// first comment
// second comment
import z from 'z';
import c from 'c';
import g from 'g';
import t from 't';
import k from 'k';
import a from 'a';
`;
    const importNodes = getImportNodes(code);
    const sortedNodes = getSortedNodes(importNodes, {
        importOrder: [],
        importOrderBuiltinModulesToTop: false,
        importOrderCaseInsensitive: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: false,
        importOrderSeparation: false,
        importOrderSortSpecifiers: false,
    });
    const formatted = getCodeFromAst({
        nodesToOutput: sortedNodes,
        originalCode: code,
        directives: [],
    });
    expect(format(formatted, { parser: 'babel' })).toEqual(
        `// first comment
// second comment
import a from "a";
import c from "c";
import g from "g";
import k from "k";
import t from "t";
import z from "z";
`,
    );
});

it('merges duplicate imports correctly', () => {
    const code = `// first comment
// second comment
import z from 'z';
import c from 'c';
import g from 'g';
import t from 't';
import k from 'k';
import a from 'a';
import {b} from 'a';
`;
    const importNodes = getImportNodes(code);
    const sortedNodes = getSortedNodes(importNodes, {
        importOrder: [],
        importOrderBuiltinModulesToTop: false,
        importOrderCaseInsensitive: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: true,
        importOrderSeparation: false,
        importOrderSortSpecifiers: false,
    });
    const formatted = getCodeFromAst({
        nodesToOutput: sortedNodes,
        allOriginalImportNodes: importNodes,
        originalCode: code,
        directives: [],
    });
    expect(format(formatted, { parser: 'babel' })).toEqual(
        `// first comment
// second comment
import a, { b } from "a";
import c from "c";
import g from "g";
import k from "k";
import t from "t";
import z from "z";
`,
    );
});
