import { format } from 'prettier';

import { getCodeFromAst } from '../get-code-from-ast';
import { getImportNodes } from '../get-import-nodes';
import { getSortedNodes } from '../get-sorted-nodes';

it('sorts imports correctly', async () => {
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
        importOrderCombineTypeAndValueImports: false,
        importOrderSeparation: false,
        importOrderSortSpecifiers: false,
    });
    const formatted = getCodeFromAst({
        nodesToOutput: sortedNodes,
        originalCode: code,
        directives: [],
    });
    expect(await format(formatted, { parser: 'babel' })).toEqual(
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

it('merges duplicate imports correctly', async () => {
    const code = `// first comment
// second comment
import z from 'z';
import c from 'c';
import g from 'g';
import t from 't';
import k from 'k';
import a from 'a';
import {b, type Bee} from 'a';
import type {C} from 'c';
import type {See} from 'c';
`;
    const importNodes = getImportNodes(code, { plugins: ['typescript'] });
    const sortedNodes = getSortedNodes(importNodes, {
        importOrder: [],
        importOrderBuiltinModulesToTop: false,
        importOrderCaseInsensitive: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: true,
        importOrderCombineTypeAndValueImports: false,
        importOrderSeparation: false,
        importOrderSortSpecifiers: false,
    });
    const formatted = getCodeFromAst({
        nodesToOutput: sortedNodes,
        allOriginalImportNodes: importNodes,
        originalCode: code,
        directives: [],
    });
    expect(await format(formatted, { parser: 'babel' })).toEqual(
        `// first comment
// second comment
import a, { b, type Bee } from "a";
import c from "c";
import type { C, See } from "c";
import g from "g";
import k from "k";
import t from "t";
import z from "z";
`,
    );
});
