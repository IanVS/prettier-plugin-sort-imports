import { ImportDeclaration } from '@babel/types';
import { expect, test } from 'vitest';

import { getImportNodes } from '../get-import-nodes';
import { getSortedNodesByImportOrder } from '../get-sorted-nodes-by-import-order';
import { getSortedNodesModulesNames } from '../get-sorted-nodes-modules-names';
import { getSortedNodesNamesAndNewlines } from '../get-sorted-nodes-names-and-newlines';

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
        importOrder: ['^[./]'],
        importOrderCaseInsensitive: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: false,
        importOrderCombineTypeAndValueImports: false,
        importOrderSortSpecifiers: false,
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
        ['BY'],
        ['Ba'],
        ['XY'],
        ['Xa'],
        ['a'],
        ['c', 'cD'],
        ['g'],
        ['k', 'kE', 'kB'],
        ['tC', 'tA', 'tB'],
        ['x'],
        ['z'],
        ['local'],
    ]);
});

test('it returns all sorted nodes case-insensitive', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: ['^[./]'],
        importOrderCaseInsensitive: true,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: false,
        importOrderCombineTypeAndValueImports: false,
        importOrderSortSpecifiers: false,
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
        ['k', 'kE', 'kB'],
        ['tC', 'tA', 'tB'],
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
        importOrder: ['^a$', '^t$', '^k$', '^B', '^[./]'],
        importOrderCaseInsensitive: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: false,
        importOrderCombineTypeAndValueImports: false,
        importOrderSortSpecifiers: false,
    }) as ImportDeclaration[];

    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'node:fs/promises',
        'node:url',
        'path',
        'XY',
        'Xa',
        'c',
        'g',
        'x',
        'z',
        'a',
        't',
        'k',
        'BY',
        'Ba',
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
        ['XY'],
        ['Xa'],
        ['c', 'cD'],
        ['g'],
        ['x'],
        ['z'],
        ['a'],
        ['tC', 'tA', 'tB'],
        ['k', 'kE', 'kB'],
        ['BY'],
        ['Ba'],
        ['local'],
    ]);
});

test('it returns all sorted nodes with sort order case-insensitive', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: ['^a$', '^t$', '^k$', '^B', '^[./]'],
        importOrderCaseInsensitive: true,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: false,
        importOrderCombineTypeAndValueImports: false,
        importOrderSortSpecifiers: false,
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
        ['tC', 'tA', 'tB'],
        ['k', 'kE', 'kB'],
        ['Ba'],
        ['BY'],
        ['local'],
    ]);
});

test('it returns all sorted import nodes with sorted import specifiers', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: ['^a$', '^t$', '^k$', '^B', '^[./]'],
        importOrderCaseInsensitive: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: false,
        importOrderCombineTypeAndValueImports: false,
        importOrderSortSpecifiers: true,
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'node:fs/promises',
        'node:url',
        'path',
        'XY',
        'Xa',
        'c',
        'g',
        'x',
        'z',
        'a',
        't',
        'k',
        'BY',
        'Ba',
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
        ['XY'],
        ['Xa'],
        ['c', 'cD'],
        ['g'],
        ['x'],
        ['z'],
        ['a'],
        ['tA', 'tB', 'tC'],
        ['k', 'kB', 'kE'],
        ['BY'],
        ['Ba'],
        ['local'],
    ]);
});

test('it returns all sorted import nodes with sorted import specifiers with case-insensitive ', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: ['^a$', '^t$', '^k$', '^B', '^[./]'],
        importOrderCaseInsensitive: true,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: false,
        importOrderCombineTypeAndValueImports: false,
        importOrderSortSpecifiers: true,
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

test('it returns all sorted nodes with namespace specifiers at the top (under builtins)', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: ['^[./]'],
        importOrderCaseInsensitive: false,
        importOrderGroupNamespaceSpecifiers: true,
        importOrderMergeDuplicateImports: false,
        importOrderCombineTypeAndValueImports: false,
        importOrderSortSpecifiers: false,
    }) as ImportDeclaration[];

    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'node:fs/promises',
        'node:url',
        'path',
        'a',
        'x',
        'BY',
        'Ba',
        'XY',
        'Xa',
        'c',
        'g',
        'k',
        't',
        'z',
        './local',
    ]);
});

test('it returns all sorted nodes with builtin specifiers at the top, ', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: ['^[./]'],
        importOrderCaseInsensitive: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: false,
        importOrderCombineTypeAndValueImports: false,
        importOrderSortSpecifiers: false,
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

test('it returns all sorted nodes with custom third party modules and builtins at top', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: ['^a$', '<THIRD_PARTY_MODULES>', '^t$', '^k$', '^[./]'],
        importOrderCaseInsensitive: true,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: false,
        importOrderCombineTypeAndValueImports: false,
        importOrderSortSpecifiers: false,
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
        importOrder: [
            '^a$',
            '<THIRD_PARTY_MODULES>',
            '^t$',
            '',
            '^k$',
            '^[./]',
        ],
        importOrderCaseInsensitive: true,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: false,
        importOrderCombineTypeAndValueImports: false,
        importOrderSortSpecifiers: false,
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
        importOrder: [
            '^a$',
            '<THIRD_PARTY_MODULES>',
            '^t$',
            '',
            'notfound',
            '',
            '^k$',
            '^[./]',
        ],
        importOrderCaseInsensitive: true,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: false,
        importOrderCombineTypeAndValueImports: false,
        importOrderSortSpecifiers: false,
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
