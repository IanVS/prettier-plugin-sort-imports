import type { ImportDeclaration } from '@babel/types';

import {
    THIRD_PARTY_MODULES_SPECIAL_WORD,
    TYPES_SPECIAL_WORD,
} from '../constants';

const regexCache = new Map<string, RegExp>();
const cachedRegExp = (regExp: string) => {
    if (regexCache.has(regExp)) {
        return regexCache.get(regExp)!;
    }
    // Strip <TYPES> when creating regexp
    const result = new RegExp(regExp.replace(TYPES_SPECIAL_WORD, ''));
    regexCache.set(regExp, result);
    return result;
};

/**
 * Get the regexp group to keep the import nodes.
 *
 * This comes near the end of processing, after import declaration nodes have been combined or exploded.
 *
 * @param node
 * @param importOrder a list of [regexp or special-word] groups (no separators)
 */
export const getImportNodesMatchedGroup = (
    node: ImportDeclaration,
    importOrder: string[],
) => {
    const includesTypesSpecialWord = importOrder.some((group) =>
        group.includes(TYPES_SPECIAL_WORD),
    );
    const groupWithRegExp = importOrder
        .map((group) => ({
            group,
            regExp: cachedRegExp(group),
        }))
        // Remove explicit bare <TYPES> group, we'll deal with that at the end similar to third party modules
        .filter(({ group }) => group !== TYPES_SPECIAL_WORD);

    for (const { group, regExp } of groupWithRegExp) {
        let matched = false;
        // Type imports need to be checked separately
        // Note: this does not include import specifiers, just declarations.
        if (group.includes(TYPES_SPECIAL_WORD)) {
            // Since we stripped <TYPES> above, this will have a regexp too, e.g. local types
            matched =
                node.importKind === 'type' &&
                node.source.value.match(regExp) !== null;
        } else {
            // If <TYPES> is being used for any group, and this group doesn't have it, only look for value imports
            matched = includesTypesSpecialWord
                ? node.importKind !== 'type' &&
                  node.source.value.match(regExp) !== null
                : node.source.value.match(regExp) !== null;
        }

        if (matched) return group;
    }

    return node.importKind === 'type' && includesTypesSpecialWord
        ? TYPES_SPECIAL_WORD
        : THIRD_PARTY_MODULES_SPECIAL_WORD;
};
