import {
    type EmptyStatement,
    type ExpressionStatement,
    type ImportDeclaration,
    type ImportDefaultSpecifier,
    type ImportNamespaceSpecifier,
    type ImportSpecifier,
} from '@babel/types';
import { RequiredOptions } from 'prettier';

import { PluginConfig } from '../types';
import {
    chunkTypeOther,
    chunkTypeUnsortable,
    importFlavorIgnore,
    importFlavorSideEffect,
    importFlavorType,
    importFlavorValue,
} from './constants';

export interface PrettierOptions
    extends Required<PluginConfig>,
        RequiredOptions {}

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
export type ImportOrLine =
    | ImportDeclaration
    | ExpressionStatement
    | EmptyStatement;

export type SomeSpecifier =
    | ImportSpecifier
    | ImportDefaultSpecifier
    | ImportNamespaceSpecifier;
export type ImportRelated = ImportOrLine | SomeSpecifier;

export type GetSortedNodes = (
    nodes: ImportDeclaration[],
    options: Pick<PrettierOptions, 'importOrder'> & {
        importOrderCombineTypeAndValueImports: boolean;
    },
) => ImportOrLine[];

export type GetChunkTypeOfNode = (node: ImportDeclaration) => ChunkType;

export type GetImportFlavorOfNode = (node: ImportDeclaration) => FlavorType;

export type MergeNodesWithMatchingImportFlavors = (
    nodes: ImportDeclaration[],
    options: { importOrderCombineTypeAndValueImports: boolean },
) => ImportDeclaration[];

export type ExplodeTypeAndValueSpecifiers = (
    nodes: ImportDeclaration[],
) => ImportDeclaration[];
