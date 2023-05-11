import {
    emptyStatement,
    type Comment,
    type ImportDeclaration,
} from '@babel/types';

import {
    newLineNode,
    forceANewlineForImportsWithAttachedSingleLineComments,
    PATCH_BABEL_GENERATOR_DOUBLE_COMMENTS_ON_ONE_LINE_ISSUE,
} from '../constants';
import { ImportOrLine, SomeSpecifier, ImportRelated } from '../types';

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
        return `${node.type}::${node.start}::${node.loc.start.line}`;
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
    // Special case for leaving comments at top-of-file
    needsTopOfFileOwner?: boolean;

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
    trailingNonSameLine = MAX_COUNT_OF_LIKELY_IMPORT_STATEMENTS * 2,
    leadingAboveAllImports = MAX_COUNT_OF_LIKELY_IMPORT_STATEMENTS * 3,
}

const debugLog: typeof console.debug | undefined = undefined as any; // undefined as any, because typescript is too smart
// const debugLog: typeof console.debug = console.debug;

/**
 * Private helper for populating a comment-registry
 *
 * Walking the AST can find the same comment in multiple places,
 *  so we need to collect them all, and attach them in our preferred order.
 */
const attachCommentsToRegistryMap = <
    T extends ImportDeclaration | SomeSpecifier,
>({
    commentRegistry,
    deferredCommentClaims,

    attachmentKey,
    comments,

    owner,
    firstImportDeclaration,
}: {
    commentRegistry: Map<string, CommentEntry>;
    /**
     * This parameter lets us defer some comment attachments and process them later.
     */
    deferredCommentClaims: CommentEntry[];

    attachmentKey: (typeof orderedCommentKeysToRegister)[number];
    comments: Comment[];

    owner: T;

    firstImportDeclaration: ImportDeclaration;
}) => {
    let commentCounter = 0;

    for (const comment of comments) {
        const commentId = nodeId(comment);
        if (commentRegistry.has(commentId)) {
            // This comment was already definitively registered to be paired with a different node, so we'll skip it
            debugLog?.('Comment already registered', commentId);
            continue;
        }

        // This node is needs to be attached somewhere.

        const ownerIsSpecifier = SpecifierTypes.includes(owner.type);
        const commentIsSingleLineType = comment.type === 'CommentLine';

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
        }

        const isSameLineAsCurrentOwner =
            commentIsSingleLineType && // Prettier doesn't allow block comments to stay on same line as expressions
            owner.loc?.start.line === comment.loc?.start.line;

        // If there's a gap, but this is the first-import, don't treat this line as "attached to the next node"
        const hasLeadingGap =
            nodeId(owner) === nodeId(firstImportDeclaration) &&
            comment.loc?.start.line < (owner.loc?.start.line || 0) - 1;

        // If it's not on the same line, don't treat this line as "attached to the previous node"
        const hasTrailingGap =
            comment.loc?.start.line > (owner.loc?.start.line || 0) + 1;

        if (attachmentKey === 'trailingComments') {
            // Trailing comments might be on the same line "attached"
            // Detect if this comment is on same line as the owner
            // Or they might be double-counted (once in trailingComments and once in leadingComments of the next node)

            debugLog?.({
                isSameLineAsCurrentOwner,
                hasLeadingGap,
                hasTrailingGap,
                owner,
                comment,
            });

            if (isSameLineAsCurrentOwner) {
                commentRegistry.set(commentId, commentEntry);
            } else if (hasTrailingGap) {
                // This comment is either a leading comment on the next node, or it's an unrelated comment following the imports
                // Trailing comment, not on the same line, so either it will get attached correctly, or it will be dropped below imports
                // [Intentional empty block]
            } else {
                // This comment should be kept close to the ImportDeclaration it follows
                commentEntry.processingPriority +=
                    DeferredCommentClaimPriorityAdjustment.trailingNonSameLine;
                deferredCommentClaims.push(commentEntry);
            }
            continue; // Unnecessary, but explicit
        } else if (attachmentKey === 'leadingComments') {
            if (hasLeadingGap) {
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
export const getCommentRegistryFromImportDeclarations = (
    outputNodes: ImportDeclaration[],
    /** Original first import declaration, not the output-node! */
    firstImportDeclaration: ImportDeclaration,
) => {
    if (outputNodes.length === 0 || !firstImportDeclaration) {
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

    // debugLog?.({
    //     specifierRegistry: [...specifierRegistry.values()].map((s) => ({
    //         line: s?.loc?.start.line,
    //         name: (s as any).imported,
    //     })),
    // });

    // Detach all comments, but keep their state.
    // The babel renderer would otherwise move them around based on their original attachment.
    // Register them in a specific order (inner, trailing, leading) so that they attach appropriately (ImportDeclarations)

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
                firstImportDeclaration,
            });

            for (const specifierNode of declarationNode.specifiers) {
                attachCommentsToRegistryMap({
                    commentRegistry,
                    deferredCommentClaims,
                    attachmentKey,
                    comments: Array.from(specifierNode[attachmentKey] || []),
                    owner: specifierNode,
                    firstImportDeclaration,
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
        const id = entry.commentId;
        debugLog?.(
            'Processing deferred comment claim',
            id,
            entry.comment.value,
        );

        if (!commentRegistry.has(id)) {
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
                if (shouldPatchAssociation) {
                    debugLog?.(
                        'Reattaching orphaned specifier comment to new owner',
                        {
                            old_line: line,
                            old_association: entry.association,
                            targetAssociation,
                            old_owner: entry.owner,
                            owner,
                        },
                    );
                    debugLog?.({
                        owner_loc: owner.loc?.start,
                        comment_loc: entry.comment.loc.start,
                    });
                }

                debugLog?.(
                    'Reattaching2',
                    id,
                    entry.association,
                    targetAssociation,
                    entry.comment.value,
                    { hasNewOwner, owner, entry_owner: entry.owner },
                );
                if (entry.comment.value === ' h3 leading single-line-comment') {
                    debugLog?.(entry.comment);
                }

                commentRegistry.set(id, {
                    ...entry,
                    owner,
                    association: targetAssociation,
                });
            } else {
                debugLog?.('Attaching orphan entry', id, entry);
                commentRegistry.set(id, entry);
            }
        } else {
            debugLog?.(
                `Skipping already-attached ${id} ${
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
) {
    if (outputNodes.length === 0) {
        // attachCommentsToOutputNodes implies that there's at least one output node so this shouldn't happen
        throw new Error(
            "Fatal Internal Error: Can't attach comments to empty output",
        );
    }
    if (outputNodes[0].type !== 'EmptyStatement') {
        // Put in a dummy empty statement to attach top-of-file-comments to if one was not provided
        outputNodes.unshift(emptyStatement());
    }

    const outputRegistry = new Map<string, ImportRelated>();
    for (const outputNode of outputNodes) {
        outputRegistry.set(nodeId(outputNode), outputNode);
        if (outputNode.type === 'ImportDeclaration') {
            for (const specifier of outputNode.specifiers) {
                outputRegistry.set(nodeId(specifier), specifier);
            }
        }
    }

    for (const commentEntry of commentEntriesFromRegistry) {
        const { owner, comment, association, needsTopOfFileOwner } =
            commentEntry;

        const ownerNode = needsTopOfFileOwner
            ? outputNodes[0]
            : outputRegistry.get(nodeId(owner));

        if (!ownerNode) {
            // Shouldn't be possible if you called this helper with the right inputs!
            throw new Error("Fatal Internal Error: Couldn't find owner node");
        }

        // addComments(ownerNode, association, [comment]);
        // using Babel's addComments will reverse the comments if you iteratively attach them, so push them directly
        const commentCollection = (ownerNode[
            CommentAssociationByValue[association]
        ] = ownerNode[CommentAssociationByValue[association]] || []);
        (commentCollection as Comment[]).push(comment);
    }

    // console.debug(
    //     'outputNodes!',
    //     outputNodes.map((n) =>
    //         (n as any).specifiers?.map((s: SomeSpecifier) => ({
    //             name: s.imported?.name,
    //             leading: JSON.stringify(s.leadingComments),
    //             trailing: JSON.stringify(s.trailingComments),
    //         })),
    //     ),
    // );

    if (PATCH_BABEL_GENERATOR_DOUBLE_COMMENTS_ON_ONE_LINE_ISSUE) {
        outputNodes
            .filter((n) => n.type === 'ImportDeclaration')
            .map((n) => {
                // Patching up another bug: babel will pull up a single-line trailing-comment
                //  that follows an ImportDeclaration even if it wasn't supposed to be on the same line
                const trailingComments = n.trailingComments;
                if (
                    Array.isArray(trailingComments) &&
                    trailingComments.length >= 1
                ) {
                    if (
                        trailingComments[0].type === 'CommentLine' &&
                        trailingComments[0].loc?.start.line !== n.loc?.end.line
                    ) {
                        // This comment is on a different line, let's make sure there's a newline
                        trailingComments.unshift(
                            forceANewlineForImportsWithAttachedSingleLineComments(),
                        );
                    }
                }
                return n;
            })
            .map((n) => (n as ImportDeclaration).specifiers || [])
            .flat()
            .forEach((s) => {
                (s.leadingComments as Comment[])?.unshift(
                    forceANewlineForImportsWithAttachedSingleLineComments(),
                );
            });
    }

    if (Array.isArray(outputNodes[0].leadingComments)) {
        if (outputNodes[0].leadingComments.length > 0) {
            // Convert this to a newline node!
            outputNodes[0] = {
                ...newLineNode,
                leadingComments: outputNodes[0].leadingComments,
            };
        } else {
            outputNodes.shift(); // Remove the empty statement
        }
    }
}
