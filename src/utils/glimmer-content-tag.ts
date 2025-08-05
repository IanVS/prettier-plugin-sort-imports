/**
 * This code is adapted from prettier-plugin-ember-template-tag as of 2025/08/04,
 *
 * Specifically a combination of:
 * parse/preprocess.ts: https://github.com/ember-tooling/prettier-plugin-ember-template-tag/blob/0ceae8900654e583435960da449ab9c7e6139cd3/src/parse/preprocess.ts
 * utils/content-tag.ts: https://github.com/ember-tooling/prettier-plugin-ember-template-tag/blob/0ceae8900654e583435960da449ab9c7e6139cd3/src/utils/content-tag.ts
 *
 * This is done so that we can convert <template> tags into placeholders using the same bytes as the original source,
 * in order to parse the code with babel and extract import nodes as we require.
 */

import type { Parsed, PreprocessorOptions, Range } from 'content-tag';

const BufferMap = new Map<string, Buffer>();

function getBuffer(string_: string): Buffer {
    let buffer = BufferMap.get(string_);

    if (!buffer) {
        buffer = Buffer.from(string_);
        BufferMap.set(string_, buffer);
    }

    return buffer;
}

function parse(file: string, options?: PreprocessorOptions): Parsed[] {
    let Preprocessor;
    try {
        Preprocessor = require('content-tag').Preprocessor;
    } catch {
        throw new Error(
            ' [error] [prettier-plugin-sort-imports]: Please install content-tag@^4.0.0 to use this plugin with Ember template tags.',
        );
    }
    const preprocessor = new Preprocessor();

    return preprocessor.parse(file, options);
}

function replaceContents(
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

function sliceByteRange(
    string_: string,
    indexStart: number,
    indexEnd?: number,
): string {
    const buffer = getBuffer(string_);

    return buffer.slice(indexStart, indexEnd).toString();
}

/** Parse templates out of source code */
export function extractTemplates(code: string): Parsed[] {
    return parse(code);
}

/**
 * Replace the template with a comment that takes up the same range.
 * We don't care about the contents or parsing this back out, because we will
 * use the original source code instead.
 */
export function preprocessTemplateRange(
    template: Parsed,
    code: string,
): string {
    // Older versions of content-tag used "start/end" in range, and since we
    // specify it as an optional peer dependency, we aren't guaranteed to get the
    // correct version unless the user installs it explicitly
    if (!template.range.hasOwnProperty('startByte')) {
        throw new Error(
            ' [error] [prettier-plugin-sort-imports]: Please install content-tag@^4.0.0 to use this plugin with Ember template tags.',
        );
    }

    let prefix: string;
    let suffix: string;

    if (template.type === 'class-member') {
        // Replace with StaticBlock
        prefix = 'static{/*';
        suffix = '*/}';
    } else {
        // Replace with BlockStatement or ObjectExpression
        prefix = '{/*';
        suffix = '*/}';

        const nextToken = sliceByteRange(code, template.range.endByte).match(
            /\S+/,
        );

        if (
            nextToken &&
            (nextToken[0] === 'as' || nextToken[0] === 'satisfies')
        ) {
            // Replace with parenthesized ObjectExpression
            prefix = '(' + prefix;
            suffix = suffix + ')';
        }
    }

    const templateLength = template.range.endByte - template.range.startByte;
    const spaces = templateLength - prefix.length - suffix.length;

    return replaceContents(code, {
        contents: [prefix, ' '.repeat(spaces), suffix].join(''),
        range: template.range,
    });
}
