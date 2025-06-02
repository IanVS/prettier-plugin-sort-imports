import type { ImportDeclaration } from '@babel/types';
import { expect, test } from 'vitest';

import { getImportNodes } from '../get-import-nodes';
import { getSortedNodesByImportOrder } from '../get-sorted-nodes-by-import-order';
import { getSortedNodesModulesNames } from '../get-sorted-nodes-modules-names';
import { getSortedNodesNamesAndNewlines } from '../get-sorted-nodes-names-and-newlines';
import { testingOnly } from '../normalize-plugin-options';

const code = `// first comment
// second comment
import z from 'z';
import c, { cD } from 'c';
import g from 'g';
import { tC, tA, tB } from 't';
import k, { kE, kB } from 'k';
import * as a from 'a';
import * as local from './local';
import * as x from 'x';
import path from 'path';
import url from 'node:url';
import * as fs from "node:fs/promises"
import BY from 'BY';
import Ba from 'Ba';
import XY from 'XY';
import Xa from 'Xa';
`;

test('it returns all sorted nodes', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: testingOnly.normalizeImportOrderOption(['^[./]']),
    }) as ImportDeclaration[];

    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'node:fs/promises',
        'node:url',
        'path',
        'a',
        'Ba',
        'BY',
        'c',
        'g',
        'k',
        't',
        'x',
        'Xa',
        'XY',
        'z',
        './local',
    ]);
    expect(
        sorted
            .filter((node) => node.type === 'ImportDeclaration')
            .map((importDeclaration) =>
                getSortedNodesModulesNames(importDeclaration.specifiers),
            ),
    ).toEqual([
        ['fs'],
        ['url'], // `node:url` comes before `path`
        ['path'],
        ['a'],
        ['Ba'],
        ['BY'],
        ['c', 'cD'],
        ['g'],
        ['k', 'kB', 'kE'],
        ['tA', 'tB', 'tC'],
        ['x'],
        ['Xa'],
        ['XY'],
        ['z'],
        ['local'],
    ]);
});

test('it returns all sorted nodes with sort order', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: testingOnly.normalizeImportOrderOption([
            '^a$',
            '^t$',
            '^k$',
            '^B',
            '^[./]',
        ]),
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'node:fs/promises',
        'node:url',
        'path',
        'c',
        'g',
        'x',
        'Xa',
        'XY',
        'z',
        'a',
        't',
        'k',
        'Ba',
        'BY',
        './local',
    ]);
    expect(
        sorted
            .filter((node) => node.type === 'ImportDeclaration')
            .map((importDeclaration) =>
                getSortedNodesModulesNames(importDeclaration.specifiers),
            ),
    ).toEqual([
        ['fs'],
        ['url'], // `node:url` comes before `path`
        ['path'],
        ['c', 'cD'],
        ['g'],
        ['x'],
        ['Xa'],
        ['XY'],
        ['z'],
        ['a'],
        ['tA', 'tB', 'tC'],
        ['k', 'kB', 'kE'],
        ['Ba'],
        ['BY'],
        ['local'],
    ]);
});

test('it returns all sorted import nodes with sorted import specifiers', () => {
    const code = `
import { tC, tA, tB } from 't';
import k, { kE, kB } from 'k';
import {type B, A} from 'z';
`;

    const result = getImportNodes(code, {
        plugins: ['typescript'],
    });
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: testingOnly.normalizeImportOrderOption(['^[./]']),
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual(['k', 't', 'z']);
    expect(
        sorted
            .filter((node) => node.type === 'ImportDeclaration')
            .map((importDeclaration) =>
                getSortedNodesModulesNames(importDeclaration.specifiers),
            ),
    ).toEqual([
        ['k', 'kB', 'kE'],
        ['tA', 'tB', 'tC'],
        ['A', 'B'],
    ]);
});

test('it returns all sorted nodes with builtin specifiers at the top', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: testingOnly.normalizeImportOrderOption(['^[./]']),
    }) as ImportDeclaration[];

    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'node:fs/promises',
        'node:url',
        'path',
        'a',
        'Ba',
        'BY',
        'c',
        'g',
        'k',
        't',
        'x',
        'Xa',
        'XY',
        'z',
        './local',
    ]);
});

test('it returns all sorted nodes with custom third party modules and builtins at top', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: testingOnly.normalizeImportOrderOption([
            '^a$',
            '<THIRD_PARTY_MODULES>',
            '^t$',
            '^k$',
            '^[./]',
        ]),
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'node:fs/promises',
        'node:url',
        'path',
        'a',
        'Ba',
        'BY',
        'c',
        'g',
        'x',
        'Xa',
        'XY',
        'z',
        't',
        'k',
        './local',
    ]);
});

test('it returns all sorted nodes with custom separation', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: testingOnly.normalizeImportOrderOption([
            '^a$',
            '<THIRD_PARTY_MODULES>',
            '^t$',
            '',
            '^k$',
            '^[./]',
        ]),
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'node:fs/promises',
        'node:url',
        'path',
        'a',
        'Ba',
        'BY',
        'c',
        'g',
        'x',
        'Xa',
        'XY',
        'z',
        't',
        '',
        'k',
        './local',
    ]);
});

test('it does not add multiple custom import separators', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: testingOnly.normalizeImportOrderOption([
            '^a$',
            '<THIRD_PARTY_MODULES>',
            '^t$',
            '',
            'notfound',
            '',
            '^k$',
            '^[./]',
        ]),
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'node:fs/promises',
        'node:url',
        'path',
        'a',
        'Ba',
        'BY',
        'c',
        'g',
        'x',
        'Xa',
        'XY',
        'z',
        't',
        '',
        'k',
        './local',
    ]);
});

test('it should sort nodes case-sensitively', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: testingOnly.normalizeImportOrderOption(['^[./]']),
        importOrderCaseSensitive: true,
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'node:fs/promises',
        'node:url',
        'path',
        'BY',
        'Ba',
        'XY',
        'Xa',
        'a',
        'c',
        'g',
        'k',
        't',
        'x',
        'z',
        './local',
    ]);
});

test('it sorts imports by line count when importOrderSortByLength is true', () => {
    const code = `
import { adjustCommentsOnSortedNodes } from 'adjust-comments-on-sorted-nodes';
import { explodeTypeAndValueSpecifiers } from 'explode-type-and-value-specifiers';
import { getChunkTypeOfNode } from 'get-chunk-type-of-node';
import { getSortedNodesByImportOrder } from 'get-sorted-nodes-by-import-order';
import { mergeNodesWithMatchingImportFlavors } from 'merge-nodes-with-matching-flavors';
`;
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: testingOnly.normalizeImportOrderOption(['^[a-z]']),
        importOrderSortByLength: true,
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'get-chunk-type-of-node',
        'adjust-comments-on-sorted-nodes',
        'get-sorted-nodes-by-import-order',
        'explode-type-and-value-specifiers',
        'merge-nodes-with-matching-flavors',
    ]);
});
