import { expect, test } from 'vitest';

import { chunkTypeOther, chunkTypeUnsortable } from '../../constants';
import { getChunkTypeOfNode } from '../get-chunk-type-of-node';
import { getImportNodes } from '../get-import-nodes';

const SAFE_OPTION_EMPTY: string[] = [];

test('it classifies a default import as other', () => {
    const importNodes = getImportNodes(`import a from "a";`);
    expect(importNodes.length).toBe(1);
    expect(getChunkTypeOfNode(importNodes[0], SAFE_OPTION_EMPTY)).toBe(
        chunkTypeOther,
    );
});

test('it classifies a named import as other', () => {
    const importNodes = getImportNodes(`import {a} from "a";`);
    expect(importNodes.length).toBe(1);
    expect(getChunkTypeOfNode(importNodes[0], SAFE_OPTION_EMPTY)).toBe(
        chunkTypeOther,
    );
});

test('it classifies a type import as other', () => {
    const importNodes = getImportNodes(`import type {a, b} from "a";`, {
        plugins: ['typescript'],
    });
    expect(importNodes.length).toBe(1);
    expect(getChunkTypeOfNode(importNodes[0], SAFE_OPTION_EMPTY)).toBe(
        chunkTypeOther,
    );
});

test('it classifies an import with type modifiers as other', () => {
    const importNodes = getImportNodes(`import {type a, b} from "a";`, {
        plugins: ['typescript'],
    });
    expect(importNodes.length).toBe(1);
    expect(getChunkTypeOfNode(importNodes[0], SAFE_OPTION_EMPTY)).toBe(
        chunkTypeOther,
    );
});

test('it classifies a side-effect import as unsortable', () => {
    const importNodes = getImportNodes(`import "a";`);
    expect(importNodes.length).toBe(1);
    expect(getChunkTypeOfNode(importNodes[0], SAFE_OPTION_EMPTY)).toBe(
        chunkTypeUnsortable,
    );
});

test('it classifies a named import with an ignore next line comment as unsortable', () => {
    const importNodes = getImportNodes(`// prettier-ignore
    import {a} from "a";`);
    expect(importNodes.length).toBe(1);
    expect(getChunkTypeOfNode(importNodes[0], SAFE_OPTION_EMPTY)).toBe(
        chunkTypeUnsortable,
    );
});

test('it classifies a side-effect import with a ignore next line comment as unsortable', () => {
    const importNodes = getImportNodes(`// prettier-ignore
    import "a";`);
    expect(importNodes.length).toBe(1);
    expect(getChunkTypeOfNode(importNodes[0], SAFE_OPTION_EMPTY)).toBe(
        chunkTypeUnsortable,
    );
});

test('it classifies a type import with an ignore next line comment as unsortable', () => {
    const importNodes = getImportNodes(
        `// prettier-ignore
    import type { a } from "a";`,
        { plugins: ['typescript'] },
    );
    expect(importNodes.length).toBe(1);
    expect(getChunkTypeOfNode(importNodes[0], SAFE_OPTION_EMPTY)).toBe(
        chunkTypeUnsortable,
    );
});

test('it classifies an import with a type modifier and an ignore next line comment as unsortable', () => {
    const importNodes = getImportNodes(
        `// prettier-ignore
    import { a, type b } from "a";`,
        { plugins: ['typescript'] },
    );
    expect(importNodes.length).toBe(1);
    expect(getChunkTypeOfNode(importNodes[0], SAFE_OPTION_EMPTY)).toBe(
        chunkTypeUnsortable,
    );
});

test('it only applies the ignore next line comments to the next line', () => {
    const importNodes = getImportNodes(`// prettier-ignore
    import {b} from "b";
    import {a} from "a";`);
    expect(importNodes.length).toBe(2);
    expect(getChunkTypeOfNode(importNodes[0], SAFE_OPTION_EMPTY)).toBe(
        chunkTypeUnsortable,
    );
    expect(getChunkTypeOfNode(importNodes[1], SAFE_OPTION_EMPTY)).toBe(
        chunkTypeOther,
    );
});

test('it treats side-effect imports as safe if found in importOrderSafeSideEffects', () => {
    const importOrderSafeSideEffects = ['^\./.*\.css?', '^a$'];
    const importNodes = getImportNodes(`
    import "a";
    import "./styles.css";
    import "ab";`);
    expect(importNodes.length).toBe(3);
    expect(getChunkTypeOfNode(importNodes[0], importOrderSafeSideEffects)).toBe(
        chunkTypeOther,
    );
    expect(getChunkTypeOfNode(importNodes[1], importOrderSafeSideEffects)).toBe(
        chunkTypeOther,
    );
    expect(getChunkTypeOfNode(importNodes[2], importOrderSafeSideEffects)).toBe(
        chunkTypeUnsortable,
    );
});
