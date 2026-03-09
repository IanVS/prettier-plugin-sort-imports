import generate from '@babel/generator';
import {
    file,
    type Directive,
    type InterpreterDirective,
    type Statement,
} from '@babel/types';

import {
    newLineCharacters,
    PRETTIER_PLUGIN_SORT_IMPORTS_NEW_LINE,
} from '../constants';
import { getAllCommentsFromNodes } from './get-all-comments-from-nodes';
import { removeNodesFromOriginalCode } from './remove-nodes-from-original-code';

const generatedImportSeparatorRegex = new RegExp(
    `(^|\\r?\\n)(?:"${PRETTIER_PLUGIN_SORT_IMPORTS_NEW_LINE}";(?:\\r?\\n|$))+`,
    'g',
);

const leadingBlankLinesRegex = /^(?:[ \t]*\r?\n)+/;
const trailingLineBreaksRegex = /(?:[ \t]*\r?\n)+$/;
const lineBreakUnitRegex = /[ \t]*\r?\n/g;

/**
 * This function generates a code string from the passed nodes.
 * @param nodesToOutput The remaining imports which should be rendered. (Node specifiers & types may be mutated)
 * @param allOriginalImportNodes All import nodes that were originally relevant. (This includes nodes that need to be deleted!)
 * @param originalCode The original input code that was passed to this plugin.
 * @param directives All directive prologues from the original code (e.g.
 * `"use strict";`).
 * @param interpreter Optional interpreter directives, if present (e.g.
 * `#!/bin/node`).
 */
export const getCodeFromAst = ({
    nodesToOutput,
    allOriginalImportNodes = nodesToOutput,
    originalCode,
    directives,
    interpreter,
}: {
    nodesToOutput: Statement[];
    allOriginalImportNodes?: Statement[];
    originalCode: string;
    directives: Directive[];
    interpreter?: InterpreterDirective | null;
}) => {
    const allCommentsFromImports = getAllCommentsFromNodes(nodesToOutput);
    const allCommentsFromDirectives = getAllCommentsFromNodes(directives);
    const allCommentsFromInterpreter = interpreter
        ? getAllCommentsFromNodes([interpreter])
        : [];

    const nodesToRemoveFromCode = [
        ...nodesToOutput,
        ...allOriginalImportNodes,
        ...allCommentsFromImports,
        ...allCommentsFromDirectives,
        ...allCommentsFromInterpreter,
        ...(interpreter ? [interpreter] : []),
        ...directives,
    ];
    const originalBoundaryLeadingBlankLines =
        getOriginalBoundaryLeadingBlankLines(
            originalCode,
            allOriginalImportNodes,
        );

    const codeWithoutImportsAndInterpreter = removeNodesFromOriginalCode(
        originalCode,
        nodesToRemoveFromCode,
    );
    const updatedImports = replaceGeneratedImportSeparators(
        createCodeFromAST({
            body: nodesToOutput,
            directives,
            interpreter,
        }),
    );

    const { injectIdx, updatedCode } = assembleUpdatedCode({
        updatedImports,
        codeWithoutImportsAndInterpreter,
    });
    const updatedImportsEnd = injectIdx + updatedImports.length;

    return normalizeImportBoundary(
        updatedCode,
        updatedImportsEnd,
        originalBoundaryLeadingBlankLines,
    );
};

const createCodeFromAST = ({
    body,
    directives = [],
    interpreter,
}: {
    body: Statement[];
    directives?: Directive[];
    interpreter?: InterpreterDirective | null;
}) =>
    generate(
        file({
            type: 'Program',
            body,
            directives,
            sourceType: 'module',
            interpreter,
            leadingComments: [],
            innerComments: [],
            trailingComments: [],
            start: 0,
            end: 0,
            loc: {
                start: { line: 0, column: 0, index: 0 },
                end: { line: 0, column: 0, index: 0 },
                filename: '',
                identifierName: '',
            },
        }),
        { importAttributesKeyword: 'with' },
    ).code;

const replaceGeneratedImportSeparators = (code: string) =>
    code.replace(
        generatedImportSeparatorRegex,
        (_match: string, linePrefix: string, offset: number) =>
            offset === 0 && linePrefix === '' ? '' : newLineCharacters,
    );

const assembleUpdatedCode = ({
    updatedImports,
    codeWithoutImportsAndInterpreter,
}: {
    updatedImports: string;
    codeWithoutImportsAndInterpreter: string;
}) => {
    return {
        injectIdx: 0,
        updatedCode: updatedImports + codeWithoutImportsAndInterpreter,
    };
};

const getOriginalBoundaryLeadingBlankLines = (
    originalCode: string,
    allOriginalImportNodes: Array<{ end?: number | null }>,
) => {
    const boundaryEnd = allOriginalImportNodes.reduce(
        (furthestEnd, node) =>
            typeof node.end === 'number'
                ? Math.max(furthestEnd, node.end)
                : furthestEnd,
        0,
    );

    return (
        originalCode.slice(boundaryEnd).match(leadingBlankLinesRegex)?.[0] ?? ''
    );
};

const normalizeImportBoundary = (
    updatedCode: string,
    updatedImportsEnd: number,
    originalBoundaryLeadingBlankLines: string,
) => {
    const beforeBoundary = updatedCode.slice(0, updatedImportsEnd);
    const untouchedRemainder = updatedCode.slice(updatedImportsEnd);
    const leadingBlankLines = untouchedRemainder.match(
        leadingBlankLinesRegex,
    )?.[0];

    if (!leadingBlankLines) {
        return updatedCode;
    }

    const remainderWithoutLeadingBlankLines = untouchedRemainder.slice(
        leadingBlankLines.length,
    );

    if (remainderWithoutLeadingBlankLines.trim().length === 0) {
        return beforeBoundary.replace(trailingLineBreaksRegex, '\n');
    }

    const trailingLineBreaks = beforeBoundary.match(
        trailingLineBreaksRegex,
    )?.[0];
    const trailingLineBreakUnits =
        trailingLineBreaks?.match(lineBreakUnitRegex) ?? [];
    const originalBoundaryLineBreakUnits =
        originalBoundaryLeadingBlankLines.match(lineBreakUnitRegex) ?? [];
    const preservedLeadingLineBreaks = originalBoundaryLineBreakUnits
        .slice(trailingLineBreakUnits.length)
        .join('');

    return (
        beforeBoundary +
        preservedLeadingLineBreaks +
        remainderWithoutLeadingBlankLines
    );
};
