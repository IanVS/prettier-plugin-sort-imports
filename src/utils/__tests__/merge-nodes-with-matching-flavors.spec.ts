import { format } from 'prettier';

import { getCodeFromAst } from '../get-code-from-ast';
import { getImportNodes } from '../get-import-nodes';
import { getSortedNodes } from '../get-sorted-nodes';

it('should merge duplicate imports within a given chunk', () => {
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
        importOrder: [],
        importOrderBuiltinModulesToTop: false,
        importOrderCaseInsensitive: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: true,
        importOrderSeparation: true,
        importOrderSortSpecifiers: true,
    });
    const formatted = getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives: [],
    });

    expect(format(formatted, { parser: 'babel' }))
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
it("doesn't merge duplicate imports if option disabled", () => {
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
        importOrder: [],
        importOrderBuiltinModulesToTop: false,
        importOrderCaseInsensitive: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: false,
        importOrderSeparation: true,
        importOrderSortSpecifiers: true,
    });
    const formatted = getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives: [],
    });

    expect(format(formatted, { parser: 'babel' }))
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

it('merges named and default imports correctly', () => {
    const code = `
    import A, { a } from "a";
    import { ahh } from "a";
    import { bee } from "b";
    import B from "b";
    `;
    const allOriginalImportNodes = getImportNodes(code, {
        plugins: ['typescript'],
    });

    const nodesToOutput = getSortedNodes(allOriginalImportNodes, {
        importOrder: [],
        importOrderBuiltinModulesToTop: false,
        importOrderCaseInsensitive: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: true,
        importOrderSeparation: true,
        importOrderSortSpecifiers: true,
    });
    const formatted = getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives: [],
    });

    expect(format(formatted, { parser: 'babel' }))
        .toEqual(`import A, { a, ahh } from "a";
import B, { bee } from "b";
`);
});
