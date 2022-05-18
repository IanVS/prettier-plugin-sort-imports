import { ParserPlugin } from '@babel/parser';
import { expressionStatement, stringLiteral } from '@babel/types';
import { builtinModules } from 'module';

export const flow: ParserPlugin = 'flow';
export const typescript: ParserPlugin = 'typescript';
export const jsx: ParserPlugin = 'jsx';

export const newLineCharacters = '\n\n';

export const chunkTypeUnsortable = 'unsortable';
export const chunkTypeOther = 'other';

/** import Thing from ... or import {Thing} from ... */
export const importFlavorRegular = 'regular';
/** import type {} from ...  */
export const importFlavorType = 'type';
export const importFlavorSideEffect = 'side-effect';
export const importFlavorIgnore = 'prettier-ignore';
export const mergeableImportFlavors = [
    importFlavorRegular,
    importFlavorType,
] as const;

/*
 * Used to mark the position between RegExps,
 * where the not matched imports should be placed
 */
export const THIRD_PARTY_MODULES_SPECIAL_WORD = '<THIRD_PARTY_MODULES>';
export const BUILTIN_MODULES = `^(?:node:)?(?:${builtinModules.join('|')})$`;

const PRETTIER_PLUGIN_SORT_IMPORTS_NEW_LINE =
    'PRETTIER_PLUGIN_SORT_IMPORTS_NEW_LINE';

export const newLineNode = expressionStatement(
    stringLiteral(PRETTIER_PLUGIN_SORT_IMPORTS_NEW_LINE),
);
