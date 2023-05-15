import {
    emptyStatement,
    stringLiteral,
    type CommentBlock,
    type ImportDeclaration,
} from '@babel/types';
import { describe, expect, test } from 'vitest';

import {
    attachCommentsToOutputNodes,
    CommentAssociation,
    getCommentRegistryFromImportDeclarations,
    testingOnlyExports,
} from '../get-comment-registry';

describe('getCommentRegistryFromImportDeclarations', () => {
    test('is empty if provided no comments or no first-import', () => {
        expect(
            getCommentRegistryFromImportDeclarations({
                firstImport: emptyStatement() as any,
                outputNodes: [],
            }),
        ).toEqual([]);
    });
});

describe('attachCommentsToOutputNodes', () => {
    test('throws when missing inputs', () => {
        expect(() =>
            attachCommentsToOutputNodes([], [], emptyStatement() as any),
        ).toThrow(
            new Error(
                "Fatal Internal Error: Can't attach comments to empty output",
            ),
        );
    });
    test('does not inject an EmptyStatement if there are no top-of-file comments', () => {
        const firstImport = {
            type: 'ImportDeclaration',
            specifiers: [],
            source: stringLiteral('foo'),
        } as ImportDeclaration;
        const outputNodes = [firstImport];

        attachCommentsToOutputNodes([], outputNodes, firstImport);

        expect(outputNodes[0].type).not.toEqual('EmptyStatement');
    });
    test("injects an EmptyStatement if there's a top-of-file comment", () => {
        const firstImport = {
            type: 'ImportDeclaration',
            specifiers: [],
            source: stringLiteral('foo'),
        } as ImportDeclaration;
        const comment = {
            type: 'CommentBlock',
            value: '@prettier',
        } as CommentBlock;
        const outputNodes = [firstImport];

        attachCommentsToOutputNodes(
            [
                {
                    needsTopOfFileOwner: true,
                    comment,
                    ownerIsSpecifier: false,
                    commentId: testingOnlyExports.nodeId(comment),
                    owner: firstImport,
                    association: CommentAssociation.trailing,
                    processingPriority: 0,
                },
            ],
            outputNodes,
            firstImport,
        );

        expect(outputNodes[0].type).toEqual('EmptyStatement');
    });
});
