import { format } from 'prettier';
import { expect, test } from 'vitest';

import * as plugin from '../../src/index.ts';

const defaultImportOrder = [
    '<BUILTIN_MODULES>',
    '<THIRD_PARTY_MODULES>',
    '^[.]',
];
const separatedImportOrder = [
    '<BUILTIN_MODULES>',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^[.]',
];
const angularSeparatedImportOrder = [
    '^@angular(/.*)?$',
    '',
    '^primeng(/.*)?$',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@app(/.*)?$',
    '',
    '^(\\.).*$',
];

async function formatRange(code, options = {}) {
    return format(code, {
        endOfLine: 'lf',
        filepath: 'range-formatting.ts',
        importOrder: defaultImportOrder,
        importOrderSafeSideEffects: [],
        parser: 'typescript',
        plugins: [plugin],
        ...options,
    });
}

function expectLineBreaksBetween(code, before, after, lineBreakCount) {
    const beforeIdx = code.indexOf(before);
    expect(beforeIdx).toBeGreaterThanOrEqual(0);

    const afterIdx = code.indexOf(after, beforeIdx + before.length);
    expect(afterIdx).toBeGreaterThanOrEqual(0);

    expect(code.slice(beforeIdx + before.length, afterIdx)).toMatch(
        new RegExp(`^(?:\\r?\\n){${lineBreakCount}}$`),
    );
}

function expectSingleBlankLineBetween(code, before, after) {
    expectLineBreaksBetween(code, before, after, 2);
}

// Verifies range formatting still rewrites imports when the selected range overlaps the import block.
test('range formatting keeps one blank line after imports', async () => {
    const code = `import z from 'z';
import a from 'a';

const value=1;
`;

    const importsEnd = code.indexOf('\n\n') + 1;
    const output = await formatRange(code, {
        rangeStart: 0,
        rangeEnd: importsEnd,
    });

    expect(output).toContain('import a from "a";');
    expectSingleBlankLineBetween(output, 'import z from "z";', 'const value = 1;');
});

// Verifies the original single-import repro keeps only one blank line when the selected range ends at the import line.
test('range formatting keeps one blank line for the original single-import repro', async () => {
    const code = `import { Component, OnInit } from "@angular/core";

//
`;
    const importEnd = code.indexOf('\n\n') + 1;

    const output = await formatRange(code, {
        importOrder: angularSeparatedImportOrder,
        importOrderParserPlugins: [
            'typescript',
            'classProperties',
            'decorators',
        ],
        importOrderTypeScriptVersion: '4.7.4',
        rangeStart: 0,
        rangeEnd: importEnd,
    });

    expect(output).toBe(`import { Component, OnInit } from "@angular/core";

//
`);
});

// Verifies the import boundary keeps any extra blank lines that were already present after the original single-import repro.
test('range formatting preserves more than two leftover blank lines in the original repro shape', async () => {
    const code = `import { Component, OnInit } from "@angular/core";




//
`;
    const importEnd = code.indexOf('\n\n') + 1;

    const output = await formatRange(code, {
        importOrder: angularSeparatedImportOrder,
        importOrderParserPlugins: [
            'typescript',
            'classProperties',
            'decorators',
        ],
        importOrderTypeScriptVersion: '4.7.4',
        rangeStart: 0,
        rangeEnd: importEnd,
    });

    expect(output).toBe(code);
});

// Verifies grouped imports still normalize correctly when the selected range overlaps the import block.
test('range formatting keeps one blank line between separated groups and before the next comment block', async () => {
    const code = `import b from './b';
import z from 'z';
import a from 'a';

// next block
const value = 1;
`;

    const output = await formatRange(code, {
        importOrder: separatedImportOrder,
        rangeStart: 0,
        rangeEnd: code.indexOf('// next block'),
    });

    expectSingleBlankLineBetween(output, 'import z from "z";', 'import b from "./b";');
    expectSingleBlankLineBetween(output, 'import b from "./b";', '// next block');
});

// Verifies directives stay above the rewritten imports when the selected range includes the import block.
test('range formatting keeps directives and one blank line after imports', async () => {
    const code = `'use client'
import z from 'z';
import a from 'a';

const value=1;
`;

    const output = await formatRange(code, {
        rangeStart: 0,
        rangeEnd: code.indexOf('const'),
    });

    expect(output.startsWith(`"use client";\n\nimport a from "a";\n`)).toBe(
        true,
    );
    expectSingleBlankLineBetween(output, 'import z from "z";', 'const value = 1;');
});

// Verifies import rewriting still behaves when the selected range starts inside the import block itself.
test('range formatting still works when rangeStart begins inside the import block', async () => {
    const code = `import z from 'z';
import a from 'a';

const value=1;
`;

    const output = await formatRange(code, {
        rangeStart: code.indexOf(`'z'`),
        rangeEnd: code.length,
    });

    expect(output).toContain('import a from "a";');
    expect(output).toContain('import z from "z";');
    expectSingleBlankLineBetween(output, 'import z from "z";', 'const value = 1;');
});

// Verifies CRLF input plus an overlapping import range still produces a single import/code separator.
test('CRLF range formatting keeps exactly one blank line after imports', async () => {
    const code = "import z from 'z';\r\nimport a from 'a';\r\n\r\nconst value=1;\r\n";

    const output = await formatRange(code, {
        endOfLine: 'crlf',
        rangeStart: 0,
        rangeEnd: code.indexOf('\r\n\r\n') + 1,
    });

    expect(output).toContain('\r\n');
    expectSingleBlankLineBetween(output, 'import z from "z";', 'const value = 1;');
});

// Verifies side-effect chunks still keep single separators when the selected range overlaps the import block.
test('range formatting keeps one blank line around side-effect chunks', async () => {
    const code = `import b from './b';
import './styles.css';
import z from 'z';
import a from 'a';

const value = 1;
`;

    const output = await formatRange(code, {
        importOrder: separatedImportOrder,
        rangeStart: 0,
        rangeEnd: code.indexOf('const value'),
    });

    expectSingleBlankLineBetween(output, 'import b from "./b";', 'import "./styles.css";');
    expectSingleBlankLineBetween(output, 'import "./styles.css";', 'import a from "a";');
    expectSingleBlankLineBetween(output, 'import z from "z";', 'const value = 1;');
});
