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
        errorRecovery: true,
        allowReturnOutsideFunction: true,
        allowNewTargetOutsideFunction: true,
        allowSuperOutsideMethod: true,
        allowUndeclaredExports: true,
        plugins,
    };

    // short-circuit if importOrder is an empty array (can be used to disable plugin)
    if (!remainingOptions.importOrder.length) {
        return code;
    }

    let ast: ReturnType<typeof babelParser>;
    try {
        ast = babelParser(code, parserOptions);
    } catch (err) {
        console.error(
            ' [error] [prettier-plugin-sort-imports]: import sorting aborted due to parsing error:\n%s',
            err,
        );
        return code;
    }

    const directives = ast.program.directives;
    const interpreter = ast.program.interpreter;

    const allOriginalImportNodes: ImportDeclaration[] = [];
    traverse(ast, {
        noScope: true, // This is required in order to avoid traverse errors if a variable is redefined (https://github.com/babel/babel/issues/12950#issuecomment-788974837)
        ImportDeclaration(path: NodePath<ImportDeclaration>) {
            const tsModuleParent = path.findParent((p) =>
                isTSModuleDeclaration(p.node),
            );
            // Do not sort imports inside of typescript module declarations.  See `import-inside-ts-declare.ts` test.
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
