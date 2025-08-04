/* eslint-disable jsdoc/require-jsdoc, unicorn/prefer-export-from */

import {
    Preprocessor,
    type Parsed as ContentTag,
    type PreprocessorOptions,
    type Range,
} from 'content-tag';

const BufferMap = new Map<string, Buffer>();

interface Template {
    contentRange: Range;
    contents: string;
    range: Range;
    type: 'class-member' | 'expression';
    utf16Range: {
        end: number;
        start: number;
    };
}

function getBuffer(string_: string): Buffer {
    let buffer = BufferMap.get(string_);

    if (!buffer) {
        buffer = Buffer.from(string_);
        BufferMap.set(string_, buffer);
    }

    return buffer;
}

function parse(file: string, options?: PreprocessorOptions): ContentTag[] {
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

/** Pre-processes the template info, parsing the template content to Glimmer AST. */
export function extractTemplates(code: string): Template[] {
    const contentTags = parse(code);

    const templates: Template[] = contentTags.map((contentTag) => {
        const { contentRange, contents, range, type } = contentTag;

        const utf16Range = {
            end: sliceByteRange(code, 0, range.endByte).length,
            start: sliceByteRange(code, 0, range.startByte).length,
        };

        return {
            contentRange,
            contents,
            range,
            type,
            utf16Range,
        };
    });

    return templates;
}

const PLACEHOLDER = '~';

/**
 * Replace the template with a parsable placeholder that takes up the same
 * range.
 */
export function preprocessTemplateRange(
    template: Template,
    code: string,
): string {
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

    // We need to replace forward slash with _something else_, because
    // forward slash breaks the parsed templates.
    const contents = template.contents.replaceAll('/', PLACEHOLDER);

    const templateLength = template.range.endByte - template.range.startByte;
    const spaces =
        templateLength -
        getBuffer(contents).length -
        prefix.length -
        suffix.length;

    return replaceContents(code, {
        contents: [prefix, contents, ' '.repeat(spaces), suffix].join(''),
        range: template.range,
    });
}

export type { ContentTag, Range };
