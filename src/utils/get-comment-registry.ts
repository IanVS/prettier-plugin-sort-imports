import {
    emptyStatement,
    type Comment,
    type ImportDeclaration,
} from '@babel/types';

import { newLineNode } from '../constants';
import { ImportOrLine, ImportRelated, SomeSpecifier } from '../types';

const SpecifierTypes = [
    'ImportSpecifier',
    'ImportDefaultSpecifier',
    'ImportNamespaceSpecifier',
];

function nodeId(node: Comment | ImportRelated): string {
    if (node.type === 'ImportSpecifier') {
        return `${node.type}::${node.start}::${
            node.imported.type === 'StringLiteral'
                ? node.imported.value
                : node.imported.name
        }`;
    }
    if (node.type === 'CommentLine') {
        return `${node.type}::${node.start}::${node.loc?.start.line}`;
    }
    return `${node.type}::${node.start}`;
}

export enum CommentAssociation {
    leading = 'leading',
    inner = 'inner',
    trailing = 'trailing',
}
const CommentAssociationByKey = {
    leadingComments: CommentAssociation.leading,
    innerComments: CommentAssociation.inner,
    trailingComments: CommentAssociation.trailing,
} as const;
const CommentAssociationByValue = {
    [CommentAssociation.leading]: 'leadingComments' as const,
    [CommentAssociation.inner]: 'innerComments' as const,
    [CommentAssociation.trailing]: 'trailingComments' as const,
} as const;
const orderedCommentKeysToRegister = [
    'innerComments', // Inner comments will be passed-through unchanged, so just collect them all first
    'trailingComments', // Trailing comments might need to be paired with a node if they're on the same line, so collect them second
    'leadingComments',
] as const;

export interface CommentEntry {
    owner: ImportDeclaration | SomeSpecifier;
    ownerIsSpecifier: boolean;
    /** Special case for leaving comments at top-of-file */
    needsTopOfFileOwner?: boolean;
    /** Comments that follow the last specifier must stay at the bottom of their import block! */
    needsLastSpecifierOwner?: boolean;

    commentId: string;
    comment: Comment;
    association: CommentAssociation;

    /** We need to defer some claims and prioritize them after initial processing - higher is later processing */
    processingPriority: number;
}

/** Magic number so that Specifier-linked comments are processed after other Comment-types  */
const MAX_COUNT_OF_LIKELY_IMPORT_STATEMENTS = 10000;

/** Lower number priority will be processed earlier! */
enum DeferredCommentClaimPriorityAdjustment {
    leadingSpecifier = MAX_COUNT_OF_LIKELY_IMPORT_STATEMENTS * 1,
    leadingAboveAllImports = MAX_COUNT_OF_LIKELY_IMPORT_STATEMENTS * 2,
    /** This must stay a trailing comment, because it might be a directive preceding `} from "./foo"` */
    trailingCommentForSpecifier = MAX_COUNT_OF_LIKELY_IMPORT_STATEMENTS * 3,
}

const debugLog: typeof console.debug | undefined = undefined as any; // undefined as any, because typescript is too smart
// const debugLog: typeof console.debug = console.debug;

/**
 * Private helper for populating a comment-registry
 *
 * Walking the AST can find the same comment in multiple places,
 *  so we need to collect them all, and attach them in our preferred order.
 */
const attachCommentsToRegistryMap = ({
    commentRegistry,
    deferredCommentClaims,

    attachmentKey,
    comments,

    owner,
    firstImport,
}: {
    commentRegistry: Map<string, CommentEntry>;
    /**
     * This parameter lets us defer some comment attachments and process them later.
     */
    deferredCommentClaims: CommentEntry[];

    attachmentKey: (typeof orderedCommentKeysToRegister)[number];
    comments: Comment[];

    owner: ImportDeclaration | SomeSpecifier;

    /** Original declaration, not the re-sorted output-node! */
    firstImport: ImportDeclaration;
}) => {
    let commentCounter = 0;

    for (const comment of comments) {
        const commentId = nodeId(comment);
        if (commentRegistry.has(commentId)) {
            // This comment was already definitively registered to be paired with a different node, so we'll skip it
            debugLog?.('Comment already registered', commentId);
            continue;
        }
        // This comment node is needs to be attached somewhere.

        const ownerIsSpecifier = SpecifierTypes.includes(owner.type);

        const commentEntry: CommentEntry = {
            owner,
            ownerIsSpecifier,
            commentId,
            comment,
            association: CommentAssociationByKey[attachmentKey],
            processingPriority: commentCounter++,
        };

        if (attachmentKey === 'innerComments') {
            // InnerComments are always attached to their original owner
            commentRegistry.set(commentId, commentEntry);
            continue;
        } else if (attachmentKey === 'trailingComments') {
            // Trailing comments might be on the same line "attached"
            // Detect if this comment is on same line as the owner
            // Or they might be double-counted (once in trailingComments and once in leadingComments of the next node)

            const isSameLineAsCurrentOwner =
                owner.loc?.start.line === comment.loc?.start.line;

            debugLog?.({
                isSameLineAsCurrentOwner,
                owner,
                comment,
            });

            if (isSameLineAsCurrentOwner) {
                commentRegistry.set(commentId, commentEntry);
            } else {
                // This comment is actually either a leading comment on the next node,
                //  or it's an unrelated comment following the imports
                //  or it's a trailing comment on the last specifier inside a declaration

                if (ownerIsSpecifier) {
                    // Specifier comments will just vanish if not present on an output node.
                    deferredCommentClaims.push({
                        ...commentEntry,
                        needsLastSpecifierOwner: true,
                        processingPriority:
                            commentEntry.processingPriority +
                            DeferredCommentClaimPriorityAdjustment.trailingCommentForSpecifier,
                    });
                } else {
                    // [Intentional empty block] - top-level comments will be attached as a leading attachment,
                    //  on another node or will be preserved automatically by babel & fall to bottom of imports
                }
            }
            continue; // Unnecessary, but explicit
        } else if (attachmentKey === 'leadingComments') {
            const currentOwnerIsFirstImport =
                nodeId(owner) === nodeId(firstImport);

            const endsBeforeOwner =
                (comment.loc?.end.line || 0) < (owner.loc?.start.line || 0);

            if (currentOwnerIsFirstImport && endsBeforeOwner) {
                debugLog?.('Found a disconnected leading comment', {
                    comment,
                    owner,
                    owner_loc: owner.loc,
                    comment_loc: comment.loc,
                });

                // This comment is probably a disconnected comment before all imports
                deferredCommentClaims.push({
                    ...commentEntry,
                    needsTopOfFileOwner: true,
                    processingPriority:
                        commentEntry.processingPriority +
                        DeferredCommentClaimPriorityAdjustment.leadingAboveAllImports,
                });
            } else {
                if (ownerIsSpecifier) {
                    debugLog?.(
                        'Deferring leading specifier comment attachment',
                        commentEntry.commentId,
                        commentEntry.comment.value,
                    );

                    deferredCommentClaims.push({
                        ...commentEntry,
                        processingPriority:
                            commentEntry.processingPriority +
                            DeferredCommentClaimPriorityAdjustment.leadingSpecifier,
                    });
                } else {
                    debugLog?.(
                        'Attaching',
                        attachmentKey,
                        commentId,
                        (owner as any)?.imported?.name,
                        comment.value,
                    );
                    commentRegistry.set(commentId, commentEntry);
                }
            }
            continue; // Unnecessary, but explicit
        } else {
            throw new Error(
                `Unimplemented attachmentKey ${attachmentKey} for ${nodeId(
                    owner,
                )}`,
            );
        }
    }
};

/**
 * Utility that walks ImportDeclarations and the associated comment nodes
 * It returns a list of CommentEntry objects that tell you which nodes comments should be associated with
 */
export const getCommentRegistryFromImportDeclarations = ({
    firstImport,
    outputNodes,
}: {
    /** Original declaration, not the re-sorted output-node! */
    firstImport: ImportDeclaration;

    /** Constructed Output Nodes */
    outputNodes: ImportDeclaration[];
}) => {
    if (outputNodes.length === 0 || !firstImport) {
        return [];
    }

    const commentRegistry = new Map<string, CommentEntry>();
    const deferredCommentClaims: CommentEntry[] = [];

    /**
     * Babel isn't as aggressive in pairing comments as both leading and trailing with Specifiers (as it does with ImportDeclarations)
     * This table helps us re-parent to the best specifier.
     * This registry is keyed by (original) line number, first witnessed specifier for a given line number wins.
     */
    const specifierRegistry = new Map<number, SomeSpecifier>();
    outputNodes
        .map((n) => n.specifiers)
        .flat()
        .forEach((specifier) => {
            if (specifierRegistry.has(specifier.loc?.start.line || 0)) {
                return;
            }
            specifierRegistry.set(specifier.loc?.start.line || 0, specifier);
        });

    // Detach all comments, but keep their state.
    // The babel renderer would otherwise move them around based on their original attachment.
    // Register them in a specific order: inner, trailing (i.e. same-line), leading
    // so that our highest-confidence attachment gets priority

    for (const attachmentKey of orderedCommentKeysToRegister) {
        debugLog?.(
            '==============================================================',
            attachmentKey,
        );
        for (const declarationNode of outputNodes) {
            attachCommentsToRegistryMap({
                commentRegistry,
                deferredCommentClaims,
                attachmentKey,
                comments: Array.from(declarationNode[attachmentKey] || []),
                owner: declarationNode,
                firstImport,
            });

            for (const specifierNode of declarationNode.specifiers) {
                attachCommentsToRegistryMap({
                    commentRegistry,
                    deferredCommentClaims,
                    attachmentKey,
                    comments: Array.from(specifierNode[attachmentKey] || []),
                    owner: specifierNode,
                    firstImport,
                });
            }
        }
    }

    // Sort the deferred claims, so they get attached by increasing priority-number
    deferredCommentClaims.sort(
        (a, b) => a.processingPriority - b.processingPriority,
    );

    // Merge in any comments that were orphaned, so they get reattached to their original owner
    for (const entry of deferredCommentClaims) {
        const { commentId } = entry;
        debugLog?.(
            'Processing deferred comment claim',
            commentId,
            entry.comment.value,
        );

        if (!commentRegistry.has(commentId)) {
            if (entry.ownerIsSpecifier) {
                // Find the best specifier to attach to
                const line = entry.comment.loc?.start.line || 0;
                const owner = specifierRegistry.get(line) || entry.owner;
                const hasNewOwner = nodeId(owner) !== nodeId(entry.owner);

                const shouldPatchAssociation =
                    entry.association === CommentAssociation.leading &&
                    hasNewOwner;

                const targetAssociation = shouldPatchAssociation
                    ? CommentAssociation.trailing
                    : entry.association;

                debugLog?.(
                    'Reattaching',
                    commentId,
                    entry.association,
                    targetAssociation,
                    entry.comment.value,
                    { hasNewOwner, owner, entry_owner: entry.owner },
                );

                commentRegistry.set(commentId, {
                    ...entry,
                    owner,
                    association: targetAssociation,
                });
            } else {
                debugLog?.('Attaching orphan entry', commentId, entry);
                commentRegistry.set(commentId, entry);
            }
        } else {
            debugLog?.(
                `Skipping already-attached ${commentId} ${
                    entry.ownerIsSpecifier ? 'Specifier' : 'Declaration'
                } ${entry.comment.value}`,
            );
        }
    }

    const allCommentEntries = Array.from(commentRegistry.values());
    allCommentEntries.sort(
        (a, b) => a.processingPriority - b.processingPriority,
    );
    return allCommentEntries;
};

export function attachCommentsToOutputNodes(
    commentEntriesFromRegistry: CommentEntry[],
    outputNodes: ImportOrLine[],
    /** Original declaration, not the re-sorted output-node! */
    firstImport: ImportDeclaration,
) {
    if (outputNodes.length === 0) {
        // attachCommentsToOutputNodes implies that there's at least one output node so this shouldn't happen
        throw new Error(
            "Fatal Internal Error: Can't attach comments to empty output",
        );
    }
    if (firstImport == null) {
        throw new Error(
            "Fatal Internal Error: Can't attach comments if there was no firstImport",
        );
    }

    /** Store a mapping of Specifier to ImportDeclaration */
    const parentNodeId = (specifier: SomeSpecifier) =>
        `parent::${nodeId(specifier)}`;

    const outputRegistry = new Map<string, ImportRelated>();
    for (const outputNode of outputNodes) {
        outputRegistry.set(nodeId(outputNode), outputNode);
        if (outputNode.type === 'ImportDeclaration') {
            for (const specifier of outputNode.specifiers) {
                outputRegistry.set(nodeId(specifier), specifier);
                outputRegistry.set(parentNodeId(specifier), outputNode);
            }
        }
    }

    const newFirstImport = outputNodes[0];

    for (const commentEntry of commentEntriesFromRegistry) {
        const {
            owner,
            comment,
            association,
            needsTopOfFileOwner,
            needsLastSpecifierOwner,
        } = commentEntry;

        if (needsTopOfFileOwner && outputNodes[0].type !== 'EmptyStatement') {
            // Put in a dummy empty statement to attach top-of-file-comments to if one was not provided
            const dummy = emptyStatement();
            dummy.loc = {
                start: { line: 0, column: 0 },
                end: { line: 0, column: 0 },
            };
            outputNodes.unshift(dummy);

            // Put the first import in the right spot, where the original first import started
            // Otherwise, comments at the top of the file will not be formatted correctly.
            // This is a little tricky, because the new first import might have leading comments,
            // and we have to move the node and all comments the same distance
            const commentHeight = getHeightOfLeadingComments(newFirstImport);
            const originalLoc = newFirstImport.loc;
            if (firstImport.loc && originalLoc) {
                newFirstImport.loc = {
                    start: {
                        ...firstImport.loc?.start,
                        line: firstImport.loc?.start.line + commentHeight,
                    },
                    end: {
                        ...firstImport.loc?.end,
                        line: firstImport.loc?.end.line + commentHeight,
                    },
                };
                const moveDist =
                    originalLoc.start.line - newFirstImport.loc.start.line;

                for (const commentType of orderedCommentKeysToRegister) {
                    newFirstImport[commentType]?.forEach((c) => {
                        if (c.loc) {
                            c.loc.start.line -= moveDist;
                            c.loc.end.line -= moveDist;
                        }
                    });
                }
            }
        }

        let ownerNode = needsTopOfFileOwner
            ? outputNodes[0]
            : outputRegistry.get(nodeId(owner));

        if (needsLastSpecifierOwner) {
            const parentDeclaration = outputRegistry.get(
                parentNodeId(owner as SomeSpecifier),
            ) as ImportDeclaration | undefined;

            if (
                !parentDeclaration ||
                (parentDeclaration.specifiers?.length || 0) === 0
            ) {
                throw new Error(
                    "Fatal Internal Error: Couldn't find parent declaration for a specifier",
                );
            }
            const lastSpecifier =
                parentDeclaration.specifiers[
                    parentDeclaration.specifiers.length - 1
                ];

            ownerNode = lastSpecifier;

            // Start the comment on the line below the owner, to avoid gaps
            if (
                comment.loc?.start.line !== undefined &&
                ownerNode.loc?.end.line
            ) {
                comment.loc.start.line = ownerNode.loc?.end.line + 1;
            }
        }

        if (!ownerNode) {
            // Shouldn't be possible if you called this helper with the right inputs!
            throw new Error("Fatal Internal Error: Couldn't find owner node");
        }

        // // Since we mucked with the loc of the newFirstImport, we need to be careful to
        // // keep its comments in the right place, so adjust their loc too
        if (
            ownerNode === newFirstImport &&
            association !== CommentAssociation.leading &&
            comment.loc &&
            ownerNode.loc &&
            !needsLastSpecifierOwner
        ) {
            comment.loc.start.line = ownerNode.loc.start.line;
        }

        // addComments(ownerNode, association, [comment]);
        // using Babel's addComments will reverse the comments if you iteratively attach them, so push them directly
        const commentType = needsTopOfFileOwner
            ? 'trailingComments' // use trailing comments to preserve trailing blank line if present
            : CommentAssociationByValue[association];
        const commentCollection = (ownerNode[commentType] =
            ownerNode[commentType] || []);
        (commentCollection as Comment[]).push(comment);
    }
}

function getHeightOfLeadingComments(node: ImportOrLine) {
    if (
        Array.isArray(node.leadingComments) &&
        node.leadingComments.length &&
        node.leadingComments[0].loc &&
        node.loc
    ) {
        return node.loc.start.line - node.leadingComments[0].loc.start.line;
    }
    return 0;
}
