import { ParserOptions, parse as babelParser } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import { ImportDeclaration, isTSModuleDeclaration } from '@babel/types';

import { TYPES_SPECIAL_WORD } from '../constants';
import { PrettierOptions } from '../types';
import { getCodeFromAst } from '../utils/get-code-from-ast';
import { getExperimentalParserPlugins } from '../utils/get-experimental-parser-plugins';
import { getSortedNodes } from '../utils/get-sorted-nodes';

export function preprocessor(code: string, options: PrettierOptions): string {
    const {
        importOrderParserPlugins,
        importOrder,
        importOrderBuiltinModulesToTop,
        importOrderCaseInsensitive,
        importOrderGroupNamespaceSpecifiers,
        importOrderMergeDuplicateImports,
        importOrderSeparation,
        importOrderSortSpecifiers,
    } = options;

    let { importOrderCombineTypeAndValueImports } = options;

    if (
        importOrderCombineTypeAndValueImports &&
        !importOrderMergeDuplicateImports
    ) {
        console.warn(
            '[@ianvs/prettier-plugin-sort-imports]: The option importOrderCombineTypeAndValueImports will have no effect since importOrderMergeDuplicateImports is not also enabled.',
        );
    }

    if (
        importOrderCombineTypeAndValueImports &&
        importOrder.some((group) => group.includes(TYPES_SPECIAL_WORD))
    ) {
        console.warn(
            `[@ianvs/prettier-plugin-sort-imports]: The option importOrderCombineTypeAndValueImports will have no effect since ${TYPES_SPECIAL_WORD} is used in importOrder.`,
        );
        importOrderCombineTypeAndValueImports = false;
    }

    const allOriginalImportNodes: ImportDeclaration[] = [];
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
                allOriginalImportNodes.push(path.node);
            }
        },
    });

    // short-circuit if there are no import declarations
    if (allOriginalImportNodes.length === 0) {
        return code;
    }

    const nodesToOutput = getSortedNodes(allOriginalImportNodes, {
        importOrder,
        importOrderBuiltinModulesToTop,
        importOrderCaseInsensitive,
        importOrderGroupNamespaceSpecifiers,
        importOrderMergeDuplicateImports,
        importOrderCombineTypeAndValueImports,
        importOrderSeparation,
        importOrderSortSpecifiers,
    });

    return getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives,
        interpreter,
    });
}
