import { describe, expect, test } from 'vitest';

import {
    BUILTIN_MODULES_REGEX_STR,
    BUILTIN_MODULES_SPECIAL_WORD,
    THIRD_PARTY_MODULES_SPECIAL_WORD,
} from '../../constants';
import { NormalizableOptions } from '../../types';
import {
    examineAndNormalizePluginOptions,
    testingOnly,
} from '../normalize-plugin-options';

describe('normalizeImportOrderOption', () => {
    test('it should inject required modules if not present', () => {
        expect(testingOnly.normalizeImportOrderOption([])).toEqual([
            BUILTIN_MODULES_REGEX_STR,
            THIRD_PARTY_MODULES_SPECIAL_WORD,
        ]);
        expect(testingOnly.normalizeImportOrderOption(['^[.]'])).toEqual([
            BUILTIN_MODULES_REGEX_STR,
            THIRD_PARTY_MODULES_SPECIAL_WORD,
            '^[.]',
        ]);
        expect(
            testingOnly.normalizeImportOrderOption([
                '<THIRD_PARTY_MODULES>',
                '^[.]',
            ]),
        ).toEqual([
            BUILTIN_MODULES_REGEX_STR,
            THIRD_PARTY_MODULES_SPECIAL_WORD,
            '^[.]',
        ]);
        expect(
            testingOnly.normalizeImportOrderOption([
                '<BUILTIN_MODULES>',
                '^[.]',
            ]),
        ).toEqual([
            THIRD_PARTY_MODULES_SPECIAL_WORD,
            BUILTIN_MODULES_REGEX_STR,
            '^[.]',
        ]);

        expect(
            testingOnly.normalizeImportOrderOption([
                '<BUILTIN_MODULES>',
                '<THIRD_PARTY_MODULES>',
                '^[.]',
            ]),
        ).toEqual([
            BUILTIN_MODULES_REGEX_STR,
            THIRD_PARTY_MODULES_SPECIAL_WORD,
            '^[.]',
        ]);
    });
    test('it should inject required modules *after the first-separator& if any are present', () => {
        expect(testingOnly.normalizeImportOrderOption([''])).toEqual([
            '',
            BUILTIN_MODULES_REGEX_STR,
            THIRD_PARTY_MODULES_SPECIAL_WORD,
        ]);
        expect(
            testingOnly.normalizeImportOrderOption([
                '',
                '<BUILTIN_MODULES>',
                '<THIRD_PARTY_MODULES>',
            ]),
        ).toEqual([
            '',
            BUILTIN_MODULES_REGEX_STR,
            THIRD_PARTY_MODULES_SPECIAL_WORD,
        ]);
        expect(testingOnly.normalizeImportOrderOption([' '])).toEqual([
            ' ',
            BUILTIN_MODULES_REGEX_STR,
            THIRD_PARTY_MODULES_SPECIAL_WORD,
        ]);
        expect(
            testingOnly.normalizeImportOrderOption(['', '', '^[.]']),
        ).toEqual([
            '',
            BUILTIN_MODULES_REGEX_STR,
            THIRD_PARTY_MODULES_SPECIAL_WORD,
            '',
            '^[.]',
        ]);
    });
});

describe('examineAndNormalizePluginOptions', () => {
    test('it should set most defaults', () => {
        expect(
            examineAndNormalizePluginOptions({
                importOrder: [],
                importOrderParserPlugins: [],
                importOrderTypeScriptVersion: '1.0.0',
                filepath: __filename,
            } as NormalizableOptions),
        ).toEqual({
            hasAnyCustomGroupSeparatorsInImportOrder: false,
            importOrder: [
                BUILTIN_MODULES_REGEX_STR,
                THIRD_PARTY_MODULES_SPECIAL_WORD,
            ],
            importOrderCombineTypeAndValueImports: true,
            plugins: [],
            provideGapAfterTopOfFileComments: false,
        });
    });
    test('it should detect group separators anywhere (relevant for side-effects)', () => {
        expect(
            examineAndNormalizePluginOptions({
                importOrder: [
                    BUILTIN_MODULES_SPECIAL_WORD,
                    THIRD_PARTY_MODULES_SPECIAL_WORD,
                    '',
                    '^[./]',
                ],
                importOrderParserPlugins: [],
                importOrderTypeScriptVersion: '1.0.0',
                filepath: __filename,
            } as NormalizableOptions),
        ).toEqual({
            hasAnyCustomGroupSeparatorsInImportOrder: true,
            importOrder: [
                BUILTIN_MODULES_REGEX_STR,
                THIRD_PARTY_MODULES_SPECIAL_WORD,
                '',
                '^[./]',
            ],
            importOrderCombineTypeAndValueImports: true,
            plugins: [],
            provideGapAfterTopOfFileComments: false,
        });
    });
    test('it should detect top-of-file gap', () => {
        expect(
            examineAndNormalizePluginOptions({
                importOrder: [''],
                importOrderParserPlugins: [],
                importOrderTypeScriptVersion: '1.0.0',
                filepath: __filename,
            } as NormalizableOptions),
        ).toEqual({
            hasAnyCustomGroupSeparatorsInImportOrder: true,
            importOrder: [
                '',
                BUILTIN_MODULES_REGEX_STR,
                THIRD_PARTY_MODULES_SPECIAL_WORD,
            ],
            importOrderCombineTypeAndValueImports: true,
            plugins: [],
            provideGapAfterTopOfFileComments: true,
        });
    });
    test('it should detect typescript-version-dependent-flags', () => {
        expect(
            examineAndNormalizePluginOptions({
                importOrder: [],
                importOrderParserPlugins: ['typescript'],
                importOrderTypeScriptVersion: '5.0.0',
                filepath: __filename,
            } as NormalizableOptions),
        ).toEqual({
            hasAnyCustomGroupSeparatorsInImportOrder: false,
            importOrder: [
                BUILTIN_MODULES_REGEX_STR,
                THIRD_PARTY_MODULES_SPECIAL_WORD,
            ],
            importOrderCombineTypeAndValueImports: true,
            plugins: ['typescript'],
            provideGapAfterTopOfFileComments: false,
        });
    });
    test('it should call getExperimentalParserPlugins & filter', () => {
        // full tests for getExperimentalParserPlugins is in its own spec file
        expect(
            examineAndNormalizePluginOptions({
                importOrder: [],
                importOrderParserPlugins: ['typescript', 'jsx'],
                importOrderTypeScriptVersion: '5.0.0',
                filepath: __filename,
            } as NormalizableOptions),
        ).toEqual({
            hasAnyCustomGroupSeparatorsInImportOrder: false,
            importOrder: [
                BUILTIN_MODULES_REGEX_STR,
                THIRD_PARTY_MODULES_SPECIAL_WORD,
            ],
            importOrderCombineTypeAndValueImports: true,
            plugins: ['typescript'],
            provideGapAfterTopOfFileComments: false,
        });
    });
    test('it should not have a problem with a missing filepath', () => {
        expect(
            examineAndNormalizePluginOptions({
                importOrder: [],
                importOrderParserPlugins: [],
                importOrderTypeScriptVersion: '1.0.0',
                filepath: undefined,
            } as NormalizableOptions),
        ).toEqual({
            hasAnyCustomGroupSeparatorsInImportOrder: false,
            importOrder: [
                BUILTIN_MODULES_REGEX_STR,
                THIRD_PARTY_MODULES_SPECIAL_WORD,
            ],
            importOrderCombineTypeAndValueImports: true,
            plugins: [],
            provideGapAfterTopOfFileComments: false,
        });
    });
});
