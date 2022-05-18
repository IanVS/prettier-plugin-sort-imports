import { ExpressionStatement, ImportDeclaration } from '@babel/types';
import { RequiredOptions } from 'prettier';

export interface PrettierOptions extends RequiredOptions {
    importOrder: string[];
    importOrderCaseInsensitive: boolean;
    importOrderBuiltinModulesToTop: boolean;
    importOrderGroupNamespaceSpecifiers: boolean;
    importOrderMergeDuplicateImports: boolean;
    importOrderMergeTypeImportsIntoRegular: boolean;
    importOrderSeparation: boolean;
    importOrderSortSpecifiers: boolean;
    // should be of type ParserPlugin from '@babel/parser' but prettier does not support nested arrays in options
    importOrderParserPlugins: string[];
}

export interface ImportChunk {
    nodes: ImportDeclaration[];
    type: string;
}

export type ImportGroups = Record<string, ImportDeclaration[]>;
export type ImportOrLine = ImportDeclaration | ExpressionStatement;

export type GetSortedNodes = (
    nodes: ImportDeclaration[],
    options: Pick<
        PrettierOptions,
        | 'importOrder'
        | 'importOrderBuiltinModulesToTop'
        | 'importOrderCaseInsensitive'
        | 'importOrderGroupNamespaceSpecifiers'
        | 'importOrderMergeDuplicateImports'
        | 'importOrderMergeTypeImportsIntoRegular'
        | 'importOrderSeparation'
        | 'importOrderSortSpecifiers'
    >,
) => ImportOrLine[];

export type GetChunkTypeOfNode = (node: ImportDeclaration) => string;

export type GetImportFlavorOfNode = (node: ImportDeclaration) => string;

export type MergeNodesWithMatchingImportFlavors = (
    nodes: ImportDeclaration[],
    options: { importOrderMergeTypeImportsIntoRegular: boolean },
) => ImportDeclaration[];
