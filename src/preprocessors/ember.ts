import { PrettierOptions } from '../types';
import { replaceAt } from '../utils/replace-at';
import { preprocessor } from './preprocessor';

const getParseImportsExports = () => {
    try {
        const parseImportsExports = require('parse-imports-exports');

        return parseImportsExports;
    } catch {
        throw new Error(
            'parse-imports-exports could not be loaded.  Is it installed?',
        );
    }
};

const sortImports = (code: string, options: PrettierOptions) => {
    const { parseImportsExports } = getParseImportsExports();
    const importsExports = parseImportsExports(code, {
        ignoreDynamicImports: true,
        ignoreRegexpLiterals: true,
        ignoreRequires: true,
        ignoreCommonJsExports: true,
    });

    let justImports = '';

    function ingest(collection?: {
        [key: string]: readonly {
            readonly start: number;
            readonly end: number;
        }[];
    }) {
        if (!collection) return;

        for (let [, info] of Object.entries({ ...collection })) {
            for (let pos of info) {
                justImports += code.slice(pos.start, pos.end + 1);

                let spaces = '';
                for (let i = 0; i < pos.end - pos.start; i++) {
                    spaces += ' ';
                }

                code = replaceAt(code, pos.start, spaces);
            }
        }
    }

    ingest(importsExports.namedImports);
    ingest(importsExports.namespaceImports);
    ingest(importsExports.typeNamedImports);
    ingest(importsExports.typeNamespaceImports);

    let output = preprocessor(justImports, options);
    let result = output + code;

    return result;
};

export function emberPreprocessor(code: string, options: PrettierOptions) {
    return sortImports(code, options);
}
