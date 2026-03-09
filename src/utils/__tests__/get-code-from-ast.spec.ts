import { parse as babelParser, type ParserOptions } from '@babel/parser';
import { format } from 'prettier';
import { expect, test } from 'vitest';

import { DEFAULT_IMPORT_ORDER } from '../../constants';
import { getCodeFromAst } from '../get-code-from-ast';
import { getImportNodes } from '../get-import-nodes';
import { getSortedNodes } from '../get-sorted-nodes';
import { testingOnly } from '../normalize-plugin-options';

const defaultImportOrder =
    testingOnly.normalizeImportOrderOption(DEFAULT_IMPORT_ORDER);
const separatedImportOrder = testingOnly.normalizeImportOrderOption([
    '<BUILTIN_MODULES>',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^[.]',
]);

const createSortOptions = (importOrder = defaultImportOrder) => ({
    importOrder,
    importOrderCombineTypeAndValueImports: true,
    importOrderCaseSensitive: false,
    importOrderSafeSideEffects: [],
    hasAnyCustomGroupSeparatorsInImportOrder: importOrder.some(
        (group) => group.trim() === '',
    ),
    provideGapAfterTopOfFileComments: importOrder[0]?.trim() === '',
});

const sortCode = ({
    code,
    importOrder = defaultImportOrder,
    parserOptions = {},
}: {
    code: string;
    importOrder?: string[];
    parserOptions?: ParserOptions;
}) => {
    const ast = babelParser(code, {
        ...parserOptions,
        attachComment: true,
        sourceType: 'module',
    });
    const importNodes = getImportNodes(code, {
        ...parserOptions,
        attachComment: true,
    });
    const sortedNodes = getSortedNodes(
        importNodes,
        createSortOptions(importOrder),
    );

    return getCodeFromAst({
        nodesToOutput: sortedNodes,
        allOriginalImportNodes: importNodes,
        originalCode: code,
        directives: ast.program.directives,
        interpreter: ast.program.interpreter,
    });
};

const sortAndFormatCode = async ({
    code,
    importOrder = defaultImportOrder,
    parserOptions = {},
    prettierParser,
}: {
    code: string;
    importOrder?: string[];
    parserOptions?: ParserOptions;
    prettierParser: 'babel' | 'typescript';
}) =>
    format(sortCode({ code, importOrder, parserOptions }), {
        parser: prettierParser,
    });

// Verifies the baseline sort path still emits imports in normalized order.
test('sorts imports correctly', async () => {
    const code = `import z from 'z';
import c from 'c';
import g from 'g';
import t from 't';
import k from 'k';
import a from 'a';
`;

    expect(await sortAndFormatCode({ code, prettierParser: 'babel' }))
        .toEqual(`import a from "a";
import c from "c";
import g from "g";
import k from "k";
import t from "t";
import z from "z";
`);
});

// Verifies duplicate imports are merged before the final code is emitted.
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

    expect(
        await sortAndFormatCode({
            code,
            parserOptions: { plugins: ['typescript'] },
            prettierParser: 'typescript',
        }),
    ).toEqual(`import a, { b, type Bee } from "a";
import c, { type C, type See } from "c";
import g from "g";
import k from "k";
import t from "t";
import z from "z";
`);
});

// Verifies mixed assert/with syntax is preserved and normalized through generation.
test('handles import attributes and assertions, converting to attributes when necessary', async () => {
    const code = `import z from 'z';
    import g from 'g' with { type: 'json' };
import c from 'c' assert { type: 'json' };
`;

    expect(
        await sortAndFormatCode({
            code,
            parserOptions: {
                plugins: [
                    ['importAttributes', { deprecatedAssertSyntax: true }],
                ],
            },
            prettierParser: 'babel',
        }),
    ).toEqual(`import c from "c" with { type: "json" };
import g from "g" with { type: "json" };
import z from "z";
`);
});

// Verifies leading file comments stay attached above the rewritten import block.
test('sorts imports with leading comments', () => {
    const code = `// leading comment

import z from 'z';
import a from 'a';

const value = 1;
`;

    expect(sortCode({ code })).toBe(`;
// leading comment

import a from 'a';
import z from 'z';

const value = 1;
`);
});

// Verifies extra blank lines from the original import boundary are preserved instead of collapsed away.
test('preserves extra blank lines after rewritten imports', () => {
    const code = `import z from 'z';
import a from 'a';



const value = 1;
`;

    expect(sortCode({ code })).toBe(`import a from 'a';
import z from 'z';



const value = 1;
`);
});

// Verifies original extra spacing is preserved even when the next top-level item is a comment.
test('preserves extra blank lines before the next top-level comment', () => {
    const code = `import z from 'z';
import a from 'a';



// next block
const value = 1;
`;

    expect(sortCode({ code })).toBe(`import a from 'a';
import z from 'z';



// next block
const value = 1;
`);
});

// Verifies boundary cleanup preserves both the original extra gap and the indentation on the next real line.
test('preserves indentation on the first non-empty line after imports', () => {
    const code = `import z from 'z';
import a from 'a';


    const value = 1;
`;

    expect(sortCode({ code })).toBe(`import a from 'a';
import z from 'z';


    const value = 1;
`);
});

// Verifies synthetic separator markers become a single blank line between import groups.
test('keeps a single blank line between separated import groups', () => {
    const code = `import b from './b';
import z from 'z';
import a from 'a';

const value = 1;
`;

    expect(sortCode({ code, importOrder: separatedImportOrder }))
        .toBe(`import a from 'a';
import z from 'z';

import b from './b';

const value = 1;
`);
});

// Verifies import-only files do not keep an extra trailing blank-line run at EOF.
test('does not leave trailing blank lines in import-only files with separated groups', () => {
    const code = `import b from './b';
import z from 'z';
import a from 'a';
`;

    expect(sortCode({ code, importOrder: separatedImportOrder }))
        .toBe(`import a from 'a';
import z from 'z';

import b from './b';
`);
});

// Verifies directives remain at the top and imports are reinserted after them correctly.
test('reinserts imports correctly when directives make injectIdx non-zero', () => {
    const code = `'use client'
import z from 'z';
import a from 'a';

const value=1;
`;

    expect(sortCode({ code })).toBe(`'use client';

import a from 'a';
import z from 'z';

const value=1;
`);
});

// Verifies grouped-import separators are preserved even when directives precede the imports.
test('keeps separated groups after directives when injectIdx is non-zero', () => {
    const code = `'use client'
import b from './b';
import z from 'z';
import a from 'a';

const value=1;
`;

    expect(sortCode({ code, importOrder: separatedImportOrder }))
        .toBe(`'use client';

import a from 'a';
import z from 'z';

import b from './b';

const value=1;
`);
});

// Verifies side-effect chunks keep exactly one separator on both sides after rewriting.
test('keeps single separators around side-effect chunks', () => {
    const code = `import b from './b';
import './styles.css';
import z from 'z';
import a from 'a';

const value = 1;
`;

    expect(sortCode({ code, importOrder: separatedImportOrder }))
        .toBe(`import b from './b';

import './styles.css';

import a from 'a';
import z from 'z';

const value = 1;
`);
});

// Verifies side-effect chunk output at EOF does not retain extra trailing blank lines.
test('does not leave trailing blank lines at EOF for side-effect chunks', () => {
    const code = `import b from './b';
import './styles.css';
import z from 'z';
import a from 'a';
`;

    expect(sortCode({ code, importOrder: separatedImportOrder }))
        .toBe(`import b from './b';

import './styles.css';

import a from 'a';
import z from 'z';
`);
});
