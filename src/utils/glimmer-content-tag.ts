/* eslint-disable jsdoc/require-jsdoc, unicorn/prefer-export-from */

import {
    Preprocessor,
    type Parsed as ContentTag,
    type PreprocessorOptions,
    type Range,
} from 'content-tag';

const BufferMap = new Map<string, Buffer>();

export function getBuffer(string_: string): Buffer {
    let buffer = BufferMap.get(string_);

    if (!buffer) {
        buffer = Buffer.from(string_);
        BufferMap.set(string_, buffer);
    }

    return buffer;
}

export function parse(
    file: string,
    options?: PreprocessorOptions,
): ContentTag[] {
    const preprocessor = new Preprocessor();

    return preprocessor.parse(file, options);
}

export function replaceContents(
    file: string,
    options: {
        contents: string;
        range: Range;
    },
): string {
    const { contents, range } = options;

    return [
        sliceByteRange(file, 0, range.startByte),
        contents,
        sliceByteRange(file, range.endByte),
    ].join('');
}

export function sliceByteRange(
    string_: string,
    indexStart: number,
    indexEnd?: number,
): string {
    const buffer = getBuffer(string_);

    return buffer.slice(indexStart, indexEnd).toString();
}

export type { ContentTag, Range };
