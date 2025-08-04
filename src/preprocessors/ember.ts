import {
    parse as babelParser,
    type ParseResult,
    type ParserOptions,
} from '@babel/parser';
import traverse from '@babel/traverse';
import type {
    BlockStatement,
    File,
    ObjectExpression,
    StaticBlock,
} from '@babel/types';

import { PrettierOptions } from '../types';
import { extractASTNodes } from '../utils/extract-ast-nodes';
import { getCodeFromAst } from '../utils/get-code-from-ast';
import { getSortedNodes } from '../utils/get-sorted-nodes';
import {
    getBuffer,
    parse,
    replaceContents,
    sliceByteRange,
    type Range,
} from '../utils/glimmer-content-tag';
import { examineAndNormalizePluginOptions } from '../utils/normalize-plugin-options';

interface Template {
    contentRange: Range;
    contents: string;
    range: Range;
    type: 'class-member' | 'expression';
    utf16Range: {
        end: number;
        start: number;
    };
}

const PLACEHOLDER = '~';

/**
 * Replace the template with a parsable placeholder that takes up the same
 * range.
 */
export function preprocessTemplateRange(
    template: Template,
    code: string,
): string {
    let prefix: string;
    let suffix: string;

    if (template.type === 'class-member') {
        // Replace with StaticBlock
        prefix = 'static{/*';
        suffix = '*/}';
    } else {
        // Replace with BlockStatement or ObjectExpression
        prefix = '{/*';
        suffix = '*/}';

        const nextToken = sliceByteRange(code, template.range.endByte).match(
            /\S+/,
        );

        if (
            nextToken &&
            (nextToken[0] === 'as' || nextToken[0] === 'satisfies')
        ) {
            // Replace with parenthesized ObjectExpression
            prefix = '(' + prefix;
            suffix = suffix + ')';
        }
    }

    // We need to replace forward slash with _something else_, because
    // forward slash breaks the parsed templates.
    const contents = template.contents.replaceAll('/', PLACEHOLDER);

    const templateLength = template.range.endByte - template.range.startByte;
    const spaces =
        templateLength -
        getBuffer(contents).length -
        prefix.length -
        suffix.length;

    return replaceContents(code, {
        contents: [prefix, contents, ' '.repeat(spaces), suffix].join(''),
        range: template.range,
    });
}

/** Pre-processes the template info, parsing the template content to Glimmer AST. */
export function codeToGlimmerAst(code: string): Template[] {
    const contentTags = parse(code);

    const templates: Template[] = contentTags.map((contentTag) => {
        const { contentRange, contents, range, type } = contentTag;

        const utf16Range = {
            end: sliceByteRange(code, 0, range.endByte).length,
            start: sliceByteRange(code, 0, range.startByte).length,
        };

        return {
            contentRange,
            contents,
            range,
            type,
            utf16Range,
        };
    });

    return templates;
}

/**
 * Throws an error if the condition is false.
 *
 * If no condition is provided, will always throw.
 */
export function assert(
    message: string,
    condition?: unknown,
): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

export const TEMPLATE_TAG_NAME = 'template';

export const TEMPLATE_TAG_OPEN = `<${TEMPLATE_TAG_NAME}>`;
export const TEMPLATE_TAG_CLOSE = `</${TEMPLATE_TAG_NAME}>`;

/** Converts a node into a GlimmerTemplate node */
function convertNode(
    node: BlockStatement | ObjectExpression | StaticBlock,
    rawTemplate: Template,
): void {
    node.innerComments = [];

    node.extra = Object.assign(node.extra ?? {}, {
        isGlimmerTemplate: true as const,
        template: rawTemplate,
    });
}

/** Traverses the AST and replaces the transformed template parts with other AST */
function convertAst(ast: ParseResult<File>, templates: Template[]): void {
    traverse(ast, {
        enter(path) {
            const { node } = path;

            switch (node.type) {
                case 'BlockStatement':
                case 'ObjectExpression':
                case 'StaticBlock': {
                    assert('expected range', node.range);
                    const [start, end] = node.range;

                    const templateIndex = templates.findIndex((template) => {
                        const { utf16Range } = template;

                        if (
                            utf16Range.start === start &&
                            utf16Range.end === end
                        ) {
                            return true;
                        }

                        return (
                            node.type === 'ObjectExpression' &&
                            utf16Range.start === start - 1 &&
                            utf16Range.end === end + 1
                        );
                    });

                    if (templateIndex === -1) {
                        return null;
                    }

                    const rawTemplate = templates.splice(templateIndex, 1)[0];

                    if (!rawTemplate) {
                        throw new Error(
                            'expected raw template because splice index came from findIndex',
                        );
                    }

                    const index =
                        node.innerComments?.[0] &&
                        ast.comments?.indexOf(node.innerComments[0]);

                    if (ast.comments && index !== undefined && index >= 0) {
                        ast.comments.splice(index, 1);
                    }

                    convertNode(node, rawTemplate);
                }
            }

            return null;
        },
    });

    if (templates.length > 0) {
        throw new Error(
            `failed to process all templates, ${templates.length} remaining`,
        );
    }
}

export function sortCode(
    code: string,
    originalCode: string,
    templates: Template[],
    options: PrettierOptions,
): string {
    const { plugins, ...remainingOptions } =
        examineAndNormalizePluginOptions(options);

    const parserOptions: ParserOptions = {
        sourceType: 'module',
        ranges: true,
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

    convertAst(ast, templates);

    const directives = ast.program.directives;
    const interpreter = ast.program.interpreter;

    const { importDeclarations: allOriginalImportNodes } = extractASTNodes(ast);

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
        originalCode,
        directives,
        interpreter,
    });
}

export function emberPreprocessor(code: string, options: PrettierOptions) {
    const originalCode = code;
    const templates = codeToGlimmerAst(code);

    for (const template of templates) {
        code = preprocessTemplateRange(template, code);
    }

    const sorted = sortCode(code, originalCode, templates, options);

    return sorted;
}
