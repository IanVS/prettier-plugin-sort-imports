'use strict';

import fs from 'fs';
import { extname, join, resolve } from 'path';

import prettier from 'prettier';
import { expect, test } from 'vitest';

import * as plugin from '../src';

export async function run_spec(dirname, parsers, options) {
    options = Object.assign(
        {
            plugins: [plugin],
            tabWidth: 4,
        },
        options,
    );

    /* instabul ignore if */
    if (!parsers || !parsers.length) {
        throw new Error(`No parsers were specified for ${dirname}`);
    }

    for (const filename of fs.readdirSync(dirname)) {
        const path = dirname + '/' + filename;
        if (
            extname(filename) !== '.snap' &&
            fs.lstatSync(path).isFile() &&
            filename[0] !== '.' &&
            filename !== 'ppsi.spec.ts'
        ) {
            const source = read(path).replace(/\r\n/g, '\n');

            const mergedOptions = Object.assign({}, options, {
                parser: parsers[0],
            });
            test(`${filename} - ${mergedOptions.parser}-verify`, async () => {
                const output = await prettyprint(source, path, mergedOptions);
                expect(
                    raw(source + '~'.repeat(80) + '\n' + output),
                ).toMatchSnapshot(filename);
            });

            for (const parserName of parsers.slice(1)) {
                test(`${filename} - ${parserName}-verify`, async () => {
                    const verifyOptions = Object.assign(mergedOptions, {
                        parser: parserName,
                    });
                    const verifyOutput = await prettyprint(
                        source,
                        path,
                        verifyOptions,
                    );
                    expect(output).toEqual(verifyOutput);
                });
            }
        }
    }
}

function prettyprint(src, filename, options) {
    return prettier.format(
        src,
        Object.assign(
            {
                filepath: filename,
            },
            options,
        ),
    );
}

function read(filename) {
    return fs.readFileSync(filename, 'utf8');
}

/**
 * Wraps a string in a marker object that is used by `./raw-serializer.js` to
 * directly print that string in a snapshot without escaping all double quotes.
 * Backticks will still be escaped.
 */
function raw(string) {
    if (typeof string !== 'string') {
        throw new Error('Raw snapshots have to be strings.');
    }
    return { [Symbol.for('raw')]: string };
}
