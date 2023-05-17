import semver from 'semver';

import {
    BUILTIN_MODULES_REGEX_STR,
    BUILTIN_MODULES_SPECIAL_WORD,
    THIRD_PARTY_MODULES_SPECIAL_WORD,
    TYPES_SPECIAL_WORD,
} from '../constants';
import { InspectedAndNormalizedOptions, PrettierOptions } from '../types';
import { getExperimentalParserPlugins } from './get-experimental-parser-plugins';

function normalizeImportOrderOption(
    importOrder: PrettierOptions['importOrder'],
) {
    // THIRD_PARTY_MODULES_SPECIAL_WORD is magic because "everything not matched by other groups goes here"
    // So it must always be present.
    if (!importOrder.includes(THIRD_PARTY_MODULES_SPECIAL_WORD)) {
        importOrder = [THIRD_PARTY_MODULES_SPECIAL_WORD, ...importOrder];
    }

    // Opinionated Decision: NodeJS Builtin modules should always be separate from third party modules
    // Users may want to add their own separators around them or insert other modules above them though
    if (
        !(
            importOrder.includes(BUILTIN_MODULES_SPECIAL_WORD) ||
            importOrder.includes(BUILTIN_MODULES_REGEX_STR)
        )
    ) {
        importOrder = [BUILTIN_MODULES_SPECIAL_WORD, ...importOrder];
    }

    importOrder = importOrder.map((g) =>
        g === BUILTIN_MODULES_SPECIAL_WORD ? BUILTIN_MODULES_REGEX_STR : g,
    );

    return importOrder;
}

/**
 * isCustomGroupSeparator checks if the provided pattern is intended to be used
 * as an import separator, rather than an actual group of imports.
 */
export function isCustomGroupSeparator(pattern?: string) {
    return pattern?.trim() === '';
}

export function examineAndNormalizePluginOptions(
    options: Pick<
        PrettierOptions,
        | 'importOrder'
        | 'importOrderParserPlugins'
        | 'importOrderTypeScriptVersion'
    >,
): InspectedAndNormalizedOptions {
    const { importOrderParserPlugins } = options;
    let { importOrderTypeScriptVersion } = options;

    const isTSSemverValid = semver.valid(importOrderTypeScriptVersion);
    if (!isTSSemverValid) {
        console.warn(
            `[@ianvs/prettier-plugin-sort-imports]: The option importOrderTypeScriptVersion is not a valid semver version and will be ignored.`,
        );
        importOrderTypeScriptVersion = '1.0.0';
    }

    const importOrder = normalizeImportOrderOption(options.importOrder);

    // Do not combine type and value imports if `<TYPES>` is specified explicitly
    let importOrderCombineTypeAndValueImports = importOrder.some((group) =>
        group.includes(TYPES_SPECIAL_WORD),
    )
        ? false
        : true;

    const plugins = getExperimentalParserPlugins(importOrderParserPlugins);

    // Disable importOrderCombineTypeAndValueImports if typescript is not set to a version that supports it
    if (
        plugins.includes('typescript') &&
        semver.lt(importOrderTypeScriptVersion, '4.5.0')
    ) {
        importOrderCombineTypeAndValueImports = false;
    }
    return {
        importOrder,
        importOrderCombineTypeAndValueImports,
        hasAnyCustomGroupSeparatorsInImportOrder: importOrder.some(
            isCustomGroupSeparator,
        ),
        // Now that the regex for <BUILTIN_MODULES> is present, we can check if the user
        // configured a separator before z<BUILTIN_MODULES>
        provideGapAfterTopOfFileComments: isCustomGroupSeparator(
            importOrder[0],
        ),
        plugins,
    };
}
export const testingOnly = { normalizeImportOrderOption };
