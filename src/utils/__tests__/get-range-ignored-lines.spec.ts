import { parse as babelParser } from '@babel/parser';
import { CommentBlock, CommentLine } from '@babel/types';

import { getRangeIgnoredLines } from '../get-range-ignored-lines';

function getComments(code: string): (CommentBlock | CommentLine)[] {
    return (
        babelParser(code, {
            sourceType: 'module',
        }).comments ?? []
    );
}

test('it does not find ranges when there are no ignore ranged', () => {
    const comments = getComments(`import a from "a";`);
    expect(comments.length).toBe(0);
    expect(getRangeIgnoredLines(comments)).toEqual(new Set());
});

test('it finds a range delimited by start and end comments', () => {
    const comments = getComments(`import a from "a";
    // prettier-ignore-start
    import b from "b";
    import c from "c";
    // prettier-ignore-end
    import d from "d";`);
    expect(comments.length).toBe(2);
    expect(getRangeIgnoredLines(comments)).toEqual(new Set([2, 3, 4, 5]));
});

test('it includes the line on which a block comment is placed', () => {
    const comments = getComments(`import a from "a";
    import b from "b"; /* prettier-ignore-start */
    /* prettier-ignore-end */ import c from "c";
    import d from "d";`);
    expect(comments.length).toBe(2);
    expect(getRangeIgnoredLines(comments)).toEqual(new Set([2, 3]));
});

test('it considers only the first start and end comment', () => {
    const comments = getComments(`import a from "a";
    // prettier-ignore-start
    import b from "b";
    // prettier-ignore-start
    import c from "c";
    // prettier-ignore-end
    import d from "d";
    // prettier-ignore-end
    import e from "e";`);
    expect(comments.length).toBe(4);
    expect(getRangeIgnoredLines(comments)).toEqual(new Set([2, 3, 4, 5, 6]));
});

test('it ignores unfinished start comments', () => {
    const comments = getComments(`import a from "a";
    // prettier-ignore-start
    import b from "b";
    // prettier-ignore-start
    import c from "c";
    import d from "d";
    import e from "e";`);
    expect(comments.length).toBe(2);
    expect(getRangeIgnoredLines(comments)).toEqual(new Set([]));
});
