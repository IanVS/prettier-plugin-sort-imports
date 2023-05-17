import { builtinModules } from 'module';

import type { ParserPlugin } from '@babel/parser';
import { expressionStatement, stringLiteral } from '@babel/types';

export const flow: ParserPlugin = 'flow';
export const typescript: ParserPlugin = 'typescript';
export const jsx: ParserPlugin = 'jsx';

export const newLineCharacters = '\n\n';

export const chunkTypeUnsortable = 'unsortable';
export const chunkTypeOther = 'other';

/** Value imports (including top-level default imports) - import {Thing} from ... or import Thing from ... */
export const importFlavorValue = 'value';
/** import type {} from ...  */
export const importFlavorType = 'type';
export const importFlavorSideEffect = 'side-effect';
export const importFlavorIgnore = 'prettier-ignore';
export const mergeableImportFlavors = [
    importFlavorValue,
    importFlavorType,
] as const;

export const BUILTIN_MODULES_REGEX_STR = `^(?:node:)?(?:${builtinModules.join(
    '|',
)})$`;

export const BUILTIN_MODULES_SPECIAL_WORD = '<BUILTIN_MODULES>';
/**
 * Used to mark not otherwise matched imports should be placed
 */
export const THIRD_PARTY_MODULES_SPECIAL_WORD = '<THIRD_PARTY_MODULES>';
export const TYPES_SPECIAL_WORD = '<TYPES>';

const PRETTIER_PLUGIN_SORT_IMPORTS_NEW_LINE =
    'PRETTIER_PLUGIN_SORT_IMPORTS_NEW_LINE';

/** Use this to force a newline at top-level scope (good for newlines generated between import blocks) */
export const newLineNode = expressionStatement(
    stringLiteral(PRETTIER_PLUGIN_SORT_IMPORTS_NEW_LINE),
);
/** Use this if you want to force a newline, but you're attaching to leading/inner/trailing Comments */
export const forceANewlineUsingACommentStatement = () => ({
    type: 'CommentLine' as const,
    value: 'PRETTIER_PLUGIN_SORT_IMPORTS_NEWLINE_COMMENT',
    start: -1,
    end: -1,
    loc: { start: { line: -1, column: -1 }, end: { line: -1, column: -1 } },
});

export const injectNewlinesRegex =
    /("PRETTIER_PLUGIN_SORT_IMPORTS_NEW_LINE";|\/\/PRETTIER_PLUGIN_SORT_IMPORTS_NEWLINE_COMMENT)/gi;
