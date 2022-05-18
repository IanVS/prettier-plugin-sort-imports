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
    const importNodes = getImportNodes(code, { plugins: ['typescript'] });

    const sortedNodes = getSortedNodes(importNodes, {
        importOrder: [],
        importOrderBuiltinModulesToTop: false,
        importOrderCaseInsensitive: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: true,
        importOrderMergeTypeImportsIntoRegular: false,
        importOrderSeparation: true,
        importOrderSortSpecifiers: true,
    });
    const formatted = getCodeFromAst({
        nodes: sortedNodes,
        importNodes,
        originalCode: code,
        directives: [],
    });

    expect(format(formatted, { parser: 'babel' })).toMatchInlineSnapshot(`
        "import type { A, B } from \\"a\\";
        import { Junk } from \\"junk-group-1\\";

        import \\"./side-effects1\\";

        // C, E and D will be separated from A, B because side-effects in-between
        import type { C, E } from \\"a\\";
        import { D } from \\"a\\";

        // prettier-ignore
        import type { NoMerge1 } from \\"a\\";
        // prettier-ignore
        import { NoMerge2 } from \\"a\\";

        import { F } from \\"a\\";
        // F Will be alone because prettier-ignore in-between
        import { G, H } from \\"b\\";
        import * as J from \\"c\\";
        import * as K from \\"c\\";
        // * as J, * as K can't merge because both Namespaces
        import { I } from \\"c\\";
        import { default as Def1, default as Def2 } from \\"d\\";
        import Foo1 from \\"e\\";
        import Foo2 from \\"e\\";
        import { Junk2 } from \\"junk-group-2\\";
        "
    `);
});
it('should type imports into regular imports if desired', () => {
    const code = `
    // Preserves 'import type'
    import type { A1 } from 'a';
    import type { A2 } from 'a';
    // Preserves 'import value'
    import { B1 } from 'b';
    import { B2 } from 'b';
    // Converts 'import type' to 'import value' if first
    import type { C1 } from 'c';
    import { C2 } from 'c';
    // Converts 'import type' to 'import value' if last
    import { D1 } from 'd';
    import type { D2 } from 'd';
    `;
    const importNodes = getImportNodes(code, { plugins: ['typescript'] });

    const sortedNodes = getSortedNodes(importNodes, {
        importOrder: [],
        importOrderBuiltinModulesToTop: false,
        importOrderCaseInsensitive: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: true,
        importOrderMergeTypeImportsIntoRegular: true,
        importOrderSeparation: true,
        importOrderSortSpecifiers: true,
    });
    const formatted = getCodeFromAst({
        nodes: sortedNodes,
        importNodes,
        originalCode: code,
        directives: [],
    });

    expect(format(formatted, { parser: 'babel' })).toMatchInlineSnapshot(`
        "// Preserves 'import type'
        import type { A1, A2 } from \\"a\\";
        // Preserves 'import value'
        import { B1, B2 } from \\"b\\";
        // Converts 'import type' to 'import value' if first
        import { type C1, C2 } from \\"c\\";
        // Converts 'import type' to 'import value' if last
        import { D1, type D2 } from \\"d\\";
        "
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
    const importNodes = getImportNodes(code, { plugins: ['typescript'] });

    const sortedNodes = getSortedNodes(importNodes, {
        importOrder: [],
        importOrderBuiltinModulesToTop: false,
        importOrderCaseInsensitive: false,
        importOrderGroupNamespaceSpecifiers: false,
        importOrderMergeDuplicateImports: false,
        importOrderMergeTypeImportsIntoRegular: false,
        importOrderSeparation: true,
        importOrderSortSpecifiers: true,
    });
    const formatted = getCodeFromAst({
        nodes: sortedNodes,
        importNodes,
        originalCode: code,
        directives: [],
    });

    expect(format(formatted, { parser: 'babel' })).toMatchInlineSnapshot(`
        "import type { A } from \\"a\\";
        import type { B } from \\"a\\";
        import { Junk } from \\"junk-group-1\\";

        import \\"./side-effects1\\";

        // C, E and D will be separated from A, B because side-effects in-between
        import type { C } from \\"a\\";
        import { D } from \\"a\\";
        import type { E } from \\"a\\";

        // prettier-ignore
        import type { NoMerge1 } from \\"a\\";
        // prettier-ignore
        import { NoMerge2 } from \\"a\\";

        import { F } from \\"a\\";
        import { H } from \\"b\\";
        // F Will be alone because prettier-ignore in-between
        import { G } from \\"b\\";
        import * as J from \\"c\\";
        import * as K from \\"c\\";
        // * as J, * as K can't merge because both Namespaces
        import { I } from \\"c\\";
        import { default as Def2 } from \\"d\\";
        import { default as Def1 } from \\"d\\";
        import Foo1 from \\"e\\";
        import Foo2 from \\"e\\";
        import { Junk2 } from \\"junk-group-2\\";
        "
    `);
});
