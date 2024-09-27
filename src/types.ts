import type { ParserPlugin } from '@babel/parser';
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

/** Subset of options that need to be normalized, or affect normalization */
export type NormalizableOptions = Pick<
    PrettierOptions,
    'importOrder' | 'importOrderParserPlugins' | 'importOrderTypeScriptVersion'
> &
    // filepath can be undefined when running prettier via the api on text input
    Pick<Partial<PrettierOptions>, 'filepath'>;

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

/**
 * The PrettierOptions after validation/normalization
 * - behavior flags are derived from the base options
 * - plugins is dynamically modified by filepath
 */
export interface ExtendedOptions {
    importOrder: PrettierOptions['importOrder'];
    importOrderCombineTypeAndValueImports: boolean;
    hasAnyCustomGroupSeparatorsInImportOrder: boolean;
    provideGapAfterTopOfFileComments: boolean;
    plugins: ParserPlugin[];
}

export type GetSortedNodes = (
    nodes: ImportDeclaration[],
    options: Pick<ExtendedOptions, 'importOrder'> & {
        importOrderCombineTypeAndValueImports: boolean;
        hasAnyCustomGroupSeparatorsInImportOrder?: boolean;
        provideGapAfterTopOfFileComments?: boolean;
    },
) => ImportOrLine[];

export type GetSortedNodesByImportOrder = (
    nodes: ImportDeclaration[],
    options: Pick<ExtendedOptions, 'importOrder'> & {
        importOrderCaseSensitive?: boolean;
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

export interface CommentAttachmentOptions {
    provideGapAfterTopOfFileComments?: boolean;
}
