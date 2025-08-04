import { parse as babelParser, type ParserOptions } from '@babel/parser';

import { PrettierOptions } from '../types';
import { extractASTNodes } from '../utils/extract-ast-nodes';
import { getCodeFromAst } from '../utils/get-code-from-ast';
import { getSortedNodes } from '../utils/get-sorted-nodes';
import {
    extractTemplates,
    preprocessTemplateRange,
} from '../utils/glimmer-content-tag';
import { examineAndNormalizePluginOptions } from '../utils/normalize-plugin-options';

export function sortImports(
    parseableCode: string,
    originalCode: string,
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

export function emberPreprocessor(code: string, options: PrettierOptions) {
    const originalCode = code;
    let processedCode = code;
    const templates = extractTemplates(code);

    for (const template of templates) {
        processedCode = preprocessTemplateRange(template, processedCode);
    }

    const sorted = sortImports(processedCode, originalCode, options);

    return sorted;
}
