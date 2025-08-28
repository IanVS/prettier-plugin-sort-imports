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
import { chunkTypeOther, chunkTypeUnsortable } from './constants';
import { examineAndNormalizePluginOptions } from './utils/normalize-plugin-options';

export interface PrettierOptions
    extends Required<PluginConfig>,
        RequiredOptions {}

/** Subset of options that need to be normalized, or affect normalization */
export type NormalizableOptions = Pick<
    PrettierOptions,
    | 'importOrder'
    | 'importOrderParserPlugins'
    | 'importOrderTypeScriptVersion'
    | 'importOrderCaseSensitive'
    | 'importOrderSafeSideEffects'
> &
    // filepath can be undefined when running prettier via the api on text input
    Pick<Partial<PrettierOptions>, 'filepath'>;

export type ChunkType = typeof chunkTypeOther | typeof chunkTypeUnsortable;

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
export type ExtendedOptions = ReturnType<
    typeof examineAndNormalizePluginOptions
>;

export interface CommentAttachmentOptions {
    provideGapAfterTopOfFileComments?: boolean;
}
