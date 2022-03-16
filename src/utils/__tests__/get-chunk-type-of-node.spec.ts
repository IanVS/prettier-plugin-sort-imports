import { chunkTypeOther, chunkTypeUnsortable } from "../../constants";
import { getChunkTypeOfNode } from "../get-chunk-type-of-node";
import { getImportNodes } from "../get-import-nodes";

test('it classifies a default import as other', () => {
    const importNodes = getImportNodes(`import a from "a";`);
    expect(importNodes.length).toBe(1);
    expect(getChunkTypeOfNode(importNodes[0])).toBe(chunkTypeOther);
});

test('it classifies a named import as other', () => {
    const importNodes = getImportNodes(`import {a} from "a";`);
    expect(importNodes.length).toBe(1);
    expect(getChunkTypeOfNode(importNodes[0])).toBe(chunkTypeOther);
});

test('it classifies a side-effect import as unsortable', () => {
    const importNodes = getImportNodes(`import "a";`);
    expect(importNodes.length).toBe(1);
    expect(getChunkTypeOfNode(importNodes[0])).toBe(chunkTypeUnsortable);
});

test('it classifies a named import with a ignore next line comment as unsortable', () => {
    const importNodes = getImportNodes(`// prettier-ignore
    import {a} from "a";`);
    expect(importNodes.length).toBe(1);
    expect(getChunkTypeOfNode(importNodes[0])).toBe(chunkTypeUnsortable);
});

test('it classifies a side-effect with a ignore next line comment as unsortable', () => {
    const importNodes = getImportNodes(`// prettier-ignore
    import "a";`);
    expect(importNodes.length).toBe(1);
    expect(getChunkTypeOfNode(importNodes[0])).toBe(chunkTypeUnsortable);
});

test('it only applies the ignore next line comments to the next line', () => {
    const importNodes = getImportNodes(`// prettier-ignore
    import {b} from "b";
    import {a} from "a";`);
    expect(importNodes.length).toBe(2);
    expect(getChunkTypeOfNode(importNodes[0])).toBe(chunkTypeUnsortable);
    expect(getChunkTypeOfNode(importNodes[1])).toBe(chunkTypeOther);
});
