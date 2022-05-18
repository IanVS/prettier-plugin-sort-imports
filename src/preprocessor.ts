import { ParserOptions, parse as babelParser } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import { ImportDeclaration, isTSModuleDeclaration } from '@babel/types';

import { PrettierOptions } from './types';
import { getCodeFromAst } from './utils/get-code-from-ast';
import { getExperimentalParserPlugins } from './utils/get-experimental-parser-plugins';
import { getSortedNodes } from './utils/get-sorted-nodes';

export function preprocessor(code: string, options: PrettierOptions): string {
    const {
        importOrderParserPlugins,
        importOrder,
        importOrderBuiltinModulesToTop,
        importOrderCaseInsensitive,
        importOrderGroupNamespaceSpecifiers,
        importOrderSeparation,
        importOrderSortSpecifiers,
    } = options;

    const importNodes: ImportDeclaration[] = [];
    const parserOptions: ParserOptions = {
        sourceType: 'module',
        plugins: getExperimentalParserPlugins(importOrderParserPlugins),
    };

    const ast = babelParser(code, parserOptions);

    const directives = ast.program.directives;
    const interpreter = ast.program.interpreter;

    traverse(ast, {
        ImportDeclaration(path: NodePath<ImportDeclaration>) {
            const tsModuleParent = path.findParent((p) =>
                isTSModuleDeclaration(p),
            );
            if (!tsModuleParent) {
                importNodes.push(path.node);
            }
        },
    });

    // short-circuit if there are no import declarations
    if (importNodes.length === 0) {
        return code;
    }

    const remainingImports = getSortedNodes(importNodes, {
        importOrder,
        importOrderBuiltinModulesToTop,
        importOrderCaseInsensitive,
        importOrderGroupNamespaceSpecifiers,
        importOrderSeparation,
        importOrderSortSpecifiers,
    });

    return getCodeFromAst({
        nodes: remainingImports,
        importNodes,
        originalCode: code,
        directives,
        interpreter,
    });
}
