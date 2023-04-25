import type { ImportDeclaration } from '@babel/types';

import {
    THIRD_PARTY_MODULES_SPECIAL_WORD,
    TYPES_SPECIAL_WORD,
} from '../constants';

/**
 * Get the regexp group to keep the import nodes.
 *
 * This comes near the end of processing, after import declaration nodes have been combined or exploded.
 *
 * @param node
 * @param importOrder
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
            // Strip <TYPES> when creating regexp
            regExp: new RegExp(group.replace(TYPES_SPECIAL_WORD, '')),
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
