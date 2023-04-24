import { parse as babelParser, ParserOptions } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import { ImportDeclaration, isTSModuleDeclaration } from '@babel/types';
import semver from 'semver';

import { TYPES_SPECIAL_WORD } from '../constants';
import { PrettierOptions } from '../types';
import { getCodeFromAst } from '../utils/get-code-from-ast';
import { getExperimentalParserPlugins } from '../utils/get-experimental-parser-plugins';
import { getSortedNodes } from '../utils/get-sorted-nodes';

export function preprocessor(code: string, options: PrettierOptions): string {
    const { importOrderParserPlugins, importOrder } = options;
    let { importOrderTypeScriptVersion } = options;
    const isTSSemverValid = semver.valid(importOrderTypeScriptVersion);

    if (!isTSSemverValid) {
        console.warn(
            `[@ianvs/prettier-plugin-sort-imports]: The option importOrderTypeScriptVersion is not a valid semver version and will be ignored.`,
        );
        importOrderTypeScriptVersion = '1.0.0';
    }

    // Do not combine type and value imports if `<TYPES>` is specified explicitly
    let importOrderCombineTypeAndValueImports = importOrder.some((group) =>
        group.includes(TYPES_SPECIAL_WORD),
    )
        ? false
        : true;

    const allOriginalImportNodes: ImportDeclaration[] = [];
    const parserOptions: ParserOptions = {
        sourceType: 'module',
        plugins: getExperimentalParserPlugins(importOrderParserPlugins),
    };

    // Disable importOrderCombineTypeAndValueImports if typescript is not set to a version that supports it
    if (
        parserOptions.plugins?.includes('typescript') &&
        semver.lt(importOrderTypeScriptVersion, '4.5.0')
    ) {
        importOrderCombineTypeAndValueImports = false;
    }

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
        importOrderCombineTypeAndValueImports,
    });

    return getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives,
        interpreter,
    });
}
