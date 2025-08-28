import { format } from 'prettier';
import { expect, test } from 'vitest';

import { DEFAULT_IMPORT_ORDER } from '../../constants';
import { getCodeFromAst } from '../get-code-from-ast';
import { getImportNodes } from '../get-import-nodes';
import { getSortedNodes } from '../get-sorted-nodes';
import { testingOnly } from '../normalize-plugin-options';

const defaultImportOrder =
    testingOnly.normalizeImportOrderOption(DEFAULT_IMPORT_ORDER);

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
        importOrderCaseSensitive: false,
        importOrderSafeSideEffects: [],
        hasAnyCustomGroupSeparatorsInImportOrder: false,
        provideGapAfterTopOfFileComments: false,
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
        importOrderCaseSensitive: false,
        importOrderSafeSideEffects: [],
        hasAnyCustomGroupSeparatorsInImportOrder: false,
        provideGapAfterTopOfFileComments: false,
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

test('handles import attributes and assertions, converting to attributes when necessary', async () => {
    const code = `import z from 'z';
    import g from 'g' with { type: 'json' };
import c from 'c' assert { type: 'json' };
`;
    const importNodes = getImportNodes(code, {
        plugins: [['importAttributes', { deprecatedAssertSyntax: true }]],
    });
    const sortedNodes = getSortedNodes(importNodes, {
        importOrder: defaultImportOrder,
        importOrderCombineTypeAndValueImports: true,
        importOrderCaseSensitive: false,
        importOrderSafeSideEffects: [],
        hasAnyCustomGroupSeparatorsInImportOrder: false,
        provideGapAfterTopOfFileComments: false,
    });
    const formatted = getCodeFromAst({
        nodesToOutput: sortedNodes,
        originalCode: code,
        directives: [],
    });
    expect(await format(formatted, { parser: 'babel' })).toEqual(
        `import c from "c" with { type: "json" };
import g from "g" with { type: "json" };
import z from "z";
`,
    );
});
