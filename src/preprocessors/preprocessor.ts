import { parse as babelParser, ParserOptions } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import { ImportDeclaration, isTSModuleDeclaration } from '@babel/types';

import { PrettierOptions } from '../types';
import { getCodeFromAst } from '../utils/get-code-from-ast';
import { getSortedNodes } from '../utils/get-sorted-nodes';
import { examineAndNormalizePluginOptions } from '../utils/normalize-plugin-options';

export function preprocessor(code: string, options: PrettierOptions): string {
    const { plugins, ...remainingOptions } =
        examineAndNormalizePluginOptions(options);

    const parserOptions: ParserOptions = {
        sourceType: 'module',
        attachComment: true,
        plugins,
    };

    const ast = babelParser(code, parserOptions);

    const directives = ast.program.directives;
    const interpreter = ast.program.interpreter;

    const allOriginalImportNodes: ImportDeclaration[] = [];
    traverse(ast, {
        ImportDeclaration(path: NodePath<ImportDeclaration>) {
            const tsModuleParent = path.findParent((p) =>
                isTSModuleDeclaration(p.node),
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

    const nodesToOutput = getSortedNodes(
        allOriginalImportNodes,
        remainingOptions,
    );

    return getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode: code,
        directives,
        interpreter,
    });
}
