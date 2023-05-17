import {
    BUILTIN_MODULES_REGEX_STR,
    BUILTIN_MODULES_SPECIAL_WORD,
    THIRD_PARTY_MODULES_SPECIAL_WORD,
} from '../constants';
import { PrettierOptions } from '../types';

export function normalizeImportOrderOption(
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
