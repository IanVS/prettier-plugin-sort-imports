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

/*
 * Used to mark the position between RegExps,
 * where the not matched imports should be placed
 */
export const BUILTIN_MODULES = `^(?:node:)?(?:${builtinModules.join('|')})$`;
export const THIRD_PARTY_MODULES_SPECIAL_WORD = '<THIRD_PARTY_MODULES>';
export const TYPES_SPECIAL_WORD = '<TYPES>';

const PRETTIER_PLUGIN_SORT_IMPORTS_NEW_LINE =
    'PRETTIER_PLUGIN_SORT_IMPORTS_NEW_LINE';

export const newLineNode = expressionStatement(
    stringLiteral(PRETTIER_PLUGIN_SORT_IMPORTS_NEW_LINE),
);
