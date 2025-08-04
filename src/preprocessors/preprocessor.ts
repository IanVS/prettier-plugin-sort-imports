import { parse as babelParser, ParserOptions } from '@babel/parser';

import { PrettierOptions } from '../types';
import { extractASTNodes } from '../utils/extract-ast-nodes';
import { getCodeFromAst } from '../utils/get-code-from-ast';
import { getSortedNodes } from '../utils/get-sorted-nodes';
import { examineAndNormalizePluginOptions } from '../utils/normalize-plugin-options';

/**
 *
 * @param originalCode The raw source code from the file being processed
 * @param parseableCode This is code that has been transformed (if necessary) so that babel can parse it, but is the same size as the original code
 * @param options PrettierOptions
 * @returns
 */
export function preprocessor(
    originalCode: string,
    parseableCode: string,
    options: PrettierOptions,
): string {
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
        return originalCode;
    }

    let ast: ReturnType<typeof babelParser>;
    try {
        ast = babelParser(parseableCode, parserOptions);
    } catch (err) {
        console.error(
            ' [error] [prettier-plugin-sort-imports]: import sorting aborted due to parsing error:\n%s',
            err,
        );
        return originalCode;
    }

    const directives = ast.program.directives;
    const interpreter = ast.program.interpreter;

    const { importDeclarations: allOriginalImportNodes } = extractASTNodes(ast);

    // short-circuit if there are no import declarations
    if (allOriginalImportNodes.length === 0) {
        return originalCode;
    }

    const nodesToOutput = getSortedNodes(
        allOriginalImportNodes,
        remainingOptions,
    );

    return getCodeFromAst({
        nodesToOutput,
        allOriginalImportNodes,
        originalCode,
        directives,
        interpreter,
    });
}
