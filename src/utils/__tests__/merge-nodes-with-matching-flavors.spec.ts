import { format } from 'prettier';

import { getCodeFromAst } from '../get-code-from-ast';
import { getImportNodes } from '../get-import-nodes';
import { getSortedNodes } from '../get-sorted-nodes';

const defaultOptions = {
    importOrder: [],
    importOrderBuiltinModulesToTop: false,
    importOrderCaseInsensitive: false,
    importOrderGroupNamespaceSpecifiers: false,
    importOrderMergeDuplicateImports: false,
    importOrderCombineTypeAndValueImports: false,
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
};

it('should merge duplicate imports within a given chunk', async () => {
    const code = `
    import type { A } from 'a';
    import { Junk } from 'junk-group-1'
    import type { B } from 'a';
    import "./side-effects1";
    // C, E and D will be separated from A, B because side-effects in-between
    import type { C } from 'a';
    import { D } from "a";
    import type { E } from "a";
    // prettier-ignore
    import type { NoMerge1 } from "a";
    // prettier-ignore
    import { NoMerge2 } from "a";
    import { H } from 'b';
    import { F } from 'a';
    // F Will be alone because prettier-ignore in-between

    import { G } from 'b';
    import * as J from 'c';
    import { Junk2 } from 'junk-group-2'
    import * as K from "c";
    // * as J, * as K can't merge because both Namespaces
    import {I} from "c"
    import { default as Def2 } from 'd';
    import { default as Def1 } from 'd';
    import Foo1 from 'e';
    import Foo2 from 'e';
    `;
    const allOriginalImportNodes = getImportNodes(code, {
        plugins: ['typescript'],
    });

    const nodesToOutput = getSortedNodes(allOriginalImportNodes, {
        ...defaultOptions,
        importOrderMergeDuplicateImports: true,
        importOrderCombineTypeAndValueImports: false,
    });
    const formatted = getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives: [],
    });

    expect(await format(formatted, { parser: 'babel' }))
        .toEqual(`import type { A, B } from "a";
import { Junk } from "junk-group-1";

import "./side-effects1";

// C, E and D will be separated from A, B because side-effects in-between
import type { C, E } from "a";
import { D } from "a";

// prettier-ignore
import type { NoMerge1 } from "a";
// prettier-ignore
import { NoMerge2 } from "a";

import { F } from "a";
// F Will be alone because prettier-ignore in-between
import { G, H } from "b";
import * as J from "c";
import * as K from "c";
// * as J, * as K can't merge because both Namespaces
import { I } from "c";
import { default as Def1, default as Def2 } from "d";
import Foo1 from "e";
import Foo2 from "e";
import { Junk2 } from "junk-group-2";
`);
});

it('should merge type imports into regular imports', async () => {
    const code = `
    // Preserves 'import type'
    import type { A1 } from 'a';
    import type { A2 } from 'a';
    // Preserves 'import value'
    import { B1 } from 'b';
    import { B2 } from 'b';
    // Converts 'import type' to 'import value' if first
    import { C2 } from 'c';
    import type { C1 } from 'c';
    // Sorts type import to end
    import { D1 } from 'd';
    import type { D2 } from 'd';
    `;
    const allOriginalImportNodes = getImportNodes(code, {
        plugins: ['typescript'],
    });

    const nodesToOutput = getSortedNodes(allOriginalImportNodes, {
        ...defaultOptions,
        importOrderMergeDuplicateImports: true,
        importOrderCombineTypeAndValueImports: true,
    });
    const formatted = getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives: [],
    });

    expect(await format(formatted, { parser: 'babel' }))
        .toEqual(`// Preserves 'import type'
import type { A1, A2 } from "a";
// Preserves 'import value'
import { B1, B2 } from "b";
// Converts 'import type' to 'import value' if first
import { C2, type C1 } from "c";
// Sorts type import to end
import { D1, type D2 } from "d";
`);
});

it('should combine type import and default import', async () => {
    const code = `
import type {MyType} from './source';
import defaultValue from './source';
`;
    const allOriginalImportNodes = getImportNodes(code, {
        plugins: ['typescript'],
    });

    const nodesToOutput = getSortedNodes(allOriginalImportNodes, {
        ...defaultOptions,
        importOrderMergeDuplicateImports: true,
        importOrderCombineTypeAndValueImports: true,
    });
    const formatted = getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives: [],
    });

    expect(await format(formatted, { parser: 'babel' }))
        .toEqual(`import defaultValue, { type MyType } from "./source";
`);
});

it('should not combine type import and namespace import', async () => {
    const code = `
import type {MyType} from './source';
import * as Namespace from './source';
`;
    const allOriginalImportNodes = getImportNodes(code, {
        plugins: ['typescript'],
    });

    const nodesToOutput = getSortedNodes(allOriginalImportNodes, {
        ...defaultOptions,
        importOrderMergeDuplicateImports: true,
        importOrderCombineTypeAndValueImports: true,
    });
    const formatted = getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives: [],
    });

    expect(await format(formatted, { parser: 'babel' }))
        .toEqual(`import type { MyType } from "./source";
import * as Namespace from "./source";
`);
});

it('should support aliased named imports', async () => {
    const code = `
import type {MyType} from './source';
import {value as alias} from './source';
`;
    const allOriginalImportNodes = getImportNodes(code, {
        plugins: ['typescript'],
    });

    const nodesToOutput = getSortedNodes(allOriginalImportNodes, {
        ...defaultOptions,
        importOrderMergeDuplicateImports: true,
        importOrderCombineTypeAndValueImports: true,
    });
    const formatted = getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives: [],
    });

    expect(await format(formatted, { parser: 'babel' }))
        .toEqual(`import { value as alias, type MyType } from "./source";
`);
});

it('should combine multiple imports from the same source', async () => {
    const code = `
import type {MyType, SecondType} from './source';
import {value, SecondValue} from './source';
`;
    const allOriginalImportNodes = getImportNodes(code, {
        plugins: ['typescript'],
    });

    const nodesToOutput = getSortedNodes(allOriginalImportNodes, {
        ...defaultOptions,
        importOrderMergeDuplicateImports: true,
        importOrderCombineTypeAndValueImports: true,
    });
    const formatted = getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives: [],
    });

    expect(await format(formatted, { parser: 'babel' }))
        .toEqual(`import { SecondValue, value, type MyType, type SecondType } from "./source";
`);
});

it('should combine multiple groups of imports', async () => {
    const code = `
import type {MyType} from './source';
import type {OtherType} from './other';
import {value} from './source';
import {otherValue} from './other';
`;
    const allOriginalImportNodes = getImportNodes(code, {
        plugins: ['typescript'],
    });

    const nodesToOutput = getSortedNodes(allOriginalImportNodes, {
        ...defaultOptions,
        importOrderMergeDuplicateImports: true,
        importOrderCombineTypeAndValueImports: true,
    });
    const formatted = getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives: [],
    });

    expect(await format(formatted, { parser: 'babel' }))
        .toEqual(`import { otherValue, type OtherType } from "./other";
import { value, type MyType } from "./source";
`);
});

it('should combine multiple imports statements from the same source', async () => {
    const code = `
import type {MyType} from './source';
import type {SecondType} from './source';
import {value} from './source';
import {SecondValue} from './source';
`;
    const allOriginalImportNodes = getImportNodes(code, {
        plugins: ['typescript'],
    });

    const nodesToOutput = getSortedNodes(allOriginalImportNodes, {
        ...defaultOptions,
        importOrderMergeDuplicateImports: true,
        importOrderCombineTypeAndValueImports: true,
    });
    const formatted = getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives: [],
    });

    expect(await format(formatted, { parser: 'babel' }))
        .toEqual(`import { SecondValue, value, type MyType, type SecondType } from "./source";
`);
});

it('should not impact imports from different sources', async () => {
    const code = `
import type {MyType} from './source';
import type {OtherType} from './other';
import {thirdValue} from './third'
import {value} from './source';
`;
    const allOriginalImportNodes = getImportNodes(code, {
        plugins: ['typescript'],
    });

    const nodesToOutput = getSortedNodes(allOriginalImportNodes, {
        ...defaultOptions,
        importOrderMergeDuplicateImports: true,
        importOrderCombineTypeAndValueImports: true,
    });
    const formatted = getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives: [],
    });

    expect(await format(formatted, { parser: 'babel' }))
        .toEqual(`import type { OtherType } from "./other";
import { value, type MyType } from "./source";
import { thirdValue } from "./third";
`);
});

it("doesn't merge duplicate imports if option disabled", async () => {
    const code = `
    import type { A } from 'a';
    import { Junk } from 'junk-group-1'
    import type { B } from 'a';
    import "./side-effects1";
    // C, E and D will be separated from A, B because side-effects in-between
    import type { C } from 'a';
    import { D } from "a";
    import type { E } from "a";
    // prettier-ignore
    import type { NoMerge1 } from "a";
    // prettier-ignore
    import { NoMerge2 } from "a";
    import { H } from 'b';
    import { F } from 'a';
    // F Will be alone because prettier-ignore in-between

    import { G } from 'b';
    import * as J from 'c';
    import { Junk2 } from 'junk-group-2'
    import * as K from "c";
    // * as J, * as K can't merge because both Namespaces
    import {I} from "c"
    import { default as Def2 } from 'd';
    import { default as Def1 } from 'd';
    import Foo1 from 'e';
    import Foo2 from 'e';
`;
    const allOriginalImportNodes = getImportNodes(code, {
        plugins: ['typescript'],
    });

    const nodesToOutput = getSortedNodes(
        allOriginalImportNodes,
        defaultOptions,
    );
    const formatted = getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives: [],
    });

    expect(await format(formatted, { parser: 'babel' }))
        .toEqual(`import type { A } from "a";
import type { B } from "a";
import { Junk } from "junk-group-1";

import "./side-effects1";

// C, E and D will be separated from A, B because side-effects in-between
import type { C } from "a";
import { D } from "a";
import type { E } from "a";

// prettier-ignore
import type { NoMerge1 } from "a";
// prettier-ignore
import { NoMerge2 } from "a";

import { F } from "a";
import { H } from "b";
// F Will be alone because prettier-ignore in-between
import { G } from "b";
import * as J from "c";
import * as K from "c";
// * as J, * as K can't merge because both Namespaces
import { I } from "c";
import { default as Def2 } from "d";
import { default as Def1 } from "d";
import Foo1 from "e";
import Foo2 from "e";
import { Junk2 } from "junk-group-2";
`);
});

it('should not combine default type imports', async () => {
    const code = `
    import { ComponentProps, useEffect } from "react";
    import type React from "react";
`;
    const allOriginalImportNodes = getImportNodes(code, {
        plugins: ['typescript'],
    });

    const nodesToOutput = getSortedNodes(allOriginalImportNodes, {
        ...defaultOptions,
        importOrderMergeDuplicateImports: true,
        importOrderCombineTypeAndValueImports: true,
    });
    const formatted = getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives: [],
    });

    expect(await format(formatted, { parser: 'babel' }))
        .toEqual(`import { ComponentProps, useEffect } from "react";
import type React from "react";
`);
});
