import { format } from 'prettier';
import { expect, test } from 'vitest';

import { getCodeFromAst } from '../get-code-from-ast';
import { getImportNodes } from '../get-import-nodes';
import { getSortedNodes } from '../get-sorted-nodes';
import { testingOnly } from '../normalize-plugin-options';
import { DEFAULT_IMPORT_ORDER } from '../../constants';

const defaultImportOrder = testingOnly.normalizeImportOrderOption(DEFAULT_IMPORT_ORDER);

test('sorts imports correctly', async () => {
    const code = `import z from 'z';
import c from 'c';
import g from 'g';
import t from 't';
import k from 'k';
import a from 'a';
`;
    const importNodes = getImportNodes(code);
    const sortedNodes = getSortedNodes(importNodes, {
        importOrder: defaultImportOrder,
        importOrderCombineTypeAndValueImports: true,
    });
    const formatted = getCodeFromAst({
        nodesToOutput: sortedNodes,
        originalCode: code,
        directives: [],
    });
    expect(await format(formatted, { parser: 'babel' })).toEqual(
        `import a from "a";
import c from "c";
import g from "g";
import k from "k";
import t from "t";
import z from "z";
`,
    );
});

test('merges duplicate imports correctly', async () => {
    const code = `import z from 'z';
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
        importOrder: defaultImportOrder,
        importOrderCombineTypeAndValueImports: true,
    });
    const formatted = getCodeFromAst({
        nodesToOutput: sortedNodes,
        allOriginalImportNodes: importNodes,
        originalCode: code,
        directives: [],
    });
    expect(await format(formatted, { parser: 'typescript' })).toEqual(
        `import a, { b, type Bee } from "a";
import c, { type C, type See } from "c";
import g from "g";
import k from "k";
import t from "t";
import z from "z";
`,
    );
});
