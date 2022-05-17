import { ImportDeclaration } from '@babel/types';

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
        importOrderSeparation: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderSortSpecifiers: false,
        importOrderBuiltinModulesToTop: false,
    }) as ImportDeclaration[];

    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'BY',
        'Ba',
        'XY',
        'Xa',
        'a',
        'c',
        'g',
        'k',
        'node:fs/promises',
        'node:url',
        'path',
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
        ['BY'],
        ['Ba'],
        ['XY'],
        ['Xa'],
        ['a'],
        ['c', 'cD'],
        ['g'],
        ['k', 'kE', 'kB'],
        ['fs'],
        ['url'],
        ['path'],
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
        importOrderSeparation: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderSortSpecifiers: false,
        importOrderBuiltinModulesToTop: false,
    }) as ImportDeclaration[];

    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'a',
        'Ba',
        'BY',
        'c',
        'g',
        'k',
        'node:fs/promises',
        'node:url',
        'path',
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
        ['a'],
        ['Ba'],
        ['BY'],
        ['c', 'cD'],
        ['g'],
        ['k', 'kE', 'kB'],
        ['fs'],
        ['url'],
        ['path'],
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
        importOrderSeparation: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderSortSpecifiers: false,
        importOrderBuiltinModulesToTop: false,
    }) as ImportDeclaration[];

    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'XY',
        'Xa',
        'c',
        'g',
        'node:fs/promises',
        'node:url',
        'path',
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
        ['XY'],
        ['Xa'],
        ['c', 'cD'],
        ['g'],
        ['fs'],
        ['url'],
        ['path'],
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
        importOrderSeparation: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderSortSpecifiers: false,
        importOrderBuiltinModulesToTop: false,
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'c',
        'g',
        'node:fs/promises',
        'node:url',
        'path',
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
        ['c', 'cD'],
        ['g'],
        ['fs'],
        ['url'],
        ['path'],
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
        importOrderSeparation: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderSortSpecifiers: true,
        importOrderBuiltinModulesToTop: false,
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'XY',
        'Xa',
        'c',
        'g',
        'node:fs/promises',
        'node:url',
        'path',
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
        ['XY'],
        ['Xa'],
        ['c', 'cD'],
        ['g'],
        ['fs'],
        ['url'],
        ['path'],
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
        importOrderSeparation: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderSortSpecifiers: true,
        importOrderBuiltinModulesToTop: false,
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'c',
        'g',
        'node:fs/promises',
        'node:url',
        'path',
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
        ['c', 'cD'],
        ['g'],
        ['fs'],
        ['url'],
        ['path'],
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

test('it returns all sorted nodes with custom third party modules', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: ['^a$', '<THIRD_PARTY_MODULES>', '^t$', '^k$', '^[./]'],
        importOrderSeparation: false,
        importOrderCaseInsensitive: true,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderSortSpecifiers: false,
        importOrderBuiltinModulesToTop: false,
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'a',
        'Ba',
        'BY',
        'c',
        'g',
        'node:fs/promises',
        'node:url',
        'path',
        'x',
        'Xa',
        'XY',
        'z',
        't',
        'k',
        './local',
    ]);
});

test('it returns all sorted nodes with namespace specifiers at the top', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: ['^[./]'],
        importOrderCaseInsensitive: false,
        importOrderSeparation: false,
        importOrderGroupNamespaceSpecifiers: true,
        importOrderSortSpecifiers: false,
        importOrderBuiltinModulesToTop: false,
    }) as ImportDeclaration[];

    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'a',
        'node:fs/promises',
        'x',
        'BY',
        'Ba',
        'XY',
        'Xa',
        'c',
        'g',
        'k',
        'node:url',
        'path',
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
        importOrderSeparation: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderSortSpecifiers: false,
        importOrderBuiltinModulesToTop: true,
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
        importOrderSeparation: false,
        importOrderCaseInsensitive: true,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderSortSpecifiers: false,
        importOrderBuiltinModulesToTop: true,
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

test('it adds newlines when importOrderSeparation is true', () => {
    const result = getImportNodes(code);
    const sorted = getSortedNodesByImportOrder(result, {
        importOrder: ['^[./]'],
        importOrderSeparation: true,
        importOrderCaseInsensitive: true,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderSortSpecifiers: false,
        importOrderBuiltinModulesToTop: true,
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'node:fs/promises',
        'node:url',
        'path',
        '',
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
        '',
        './local',
        '',
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
        importOrderSeparation: false,
        importOrderCaseInsensitive: true,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderSortSpecifiers: false,
        importOrderBuiltinModulesToTop: false,
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'a',
        'Ba',
        'BY',
        'c',
        'g',
        'node:fs/promises',
        'node:url',
        'path',
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

test('it allows both importOrderSeparation and custom separation (but why?)', () => {
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
        importOrderSeparation: true,
        importOrderCaseInsensitive: true,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderSortSpecifiers: false,
        importOrderBuiltinModulesToTop: false,
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'a',
        '',
        'Ba',
        'BY',
        'c',
        'g',
        'node:fs/promises',
        'node:url',
        'path',
        'x',
        'Xa',
        'XY',
        'z',
        '',
        't',
        '',
        'k',
        '',
        './local',
        '',
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
        importOrderSeparation: false,
        importOrderCaseInsensitive: true,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderSortSpecifiers: false,
        importOrderBuiltinModulesToTop: false,
    }) as ImportDeclaration[];
    expect(getSortedNodesNamesAndNewlines(sorted)).toEqual([
        'a',
        'Ba',
        'BY',
        'c',
        'g',
        'node:fs/promises',
        'node:url',
        'path',
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
