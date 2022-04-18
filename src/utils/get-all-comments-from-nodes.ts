import { CommentBlock, CommentLine, Directive, Statement } from '@babel/types';

export const getAllCommentsFromNodes = (nodes: (Directive | Statement)[]) =>
    nodes.reduce((acc, node) => {
        if (
            Array.isArray(node.leadingComments) &&
            node.leadingComments.length > 0
        ) {
            acc = [...acc, ...node.leadingComments];
        }
        return acc;
    }, [] as (CommentBlock | CommentLine)[]);
