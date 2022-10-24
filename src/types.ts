import { ExpressionStatement, ImportDeclaration } from '@babel/types';
import { RequiredOptions } from 'prettier';

import {
    chunkTypeOther,
    chunkTypeUnsortable,
    importFlavorIgnore,
    importFlavorSideEffect,
    importFlavorType,
    importFlavorValue,
} from './constants';

export interface PrettierOptions extends RequiredOptions {
    importOrder: string[];
    importOrderCaseInsensitive: boolean;
    importOrderBuiltinModulesToTop: boolean;
    importOrderGroupNamespaceSpecifiers: boolean;
    importOrderMergeDuplicateImports: boolean;
    importOrderCombineTypeAndValueImports: boolean;
    importOrderSeparation: boolean;
    importOrderSortSpecifiers: boolean;
    // should be of type ParserPlugin from '@babel/parser' but prettier does not support nested arrays in options
    importOrderParserPlugins: string[];
}

export type ChunkType = typeof chunkTypeOther | typeof chunkTypeUnsortable;
export type FlavorType =
    | typeof importFlavorIgnore
    | typeof importFlavorSideEffect
    | typeof importFlavorType
    | typeof importFlavorValue;

export interface ImportChunk {
    nodes: ImportDeclaration[];
    type: ChunkType;
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
        | 'importOrderCombineTypeAndValueImports'
        | 'importOrderSeparation'
        | 'importOrderSortSpecifiers'
    >,
) => ImportOrLine[];

export type GetChunkTypeOfNode = (node: ImportDeclaration) => ChunkType;

export type GetImportFlavorOfNode = (node: ImportDeclaration) => FlavorType;

export type MergeNodesWithMatchingImportFlavors = (
    nodes: ImportDeclaration[],
    options: { importOrderCombineTypeAndValueImports: boolean },
) => ImportDeclaration[];
