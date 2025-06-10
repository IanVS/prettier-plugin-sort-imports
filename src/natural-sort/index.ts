import { ImportDeclaration } from '@babel/types';

export function naturalSort(a: string, b: string): number {
    const left = typeof a === 'string' ? a : String(a);
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator#syntax
    const sortOptions: Intl.CollatorOptions = {
        sensitivity: 'base',
        numeric: true,
        caseFirst: 'lower',
    };
    return left.localeCompare(b, 'en', sortOptions);
}

/**
 * Using a custom comparison function here, as `String.localeCompare` does not
 * support sorting characters with all uppercase letters before lowercase
 * letters, which is the desired behavior for a case-sensitive import sort. When
 * `sensitivity` is set to `base`, `String.localeCompare` sorts alphabetically
 * and then by case, but we want to sort by case first (then alphabetical).
 */
const numericRegex = /^\d+/;
export function naturalSortCaseSensitive(a: string, b: string) {
    let aIndex = 0;
    let bIndex = 0;
    while (aIndex < Math.max(a.length, b.length)) {
        // check if we've encountered a number and compare appropriately if so
        const aNumericMatch = a.slice(aIndex).match(numericRegex);
        const bNumericMatch = b.slice(bIndex).match(numericRegex);
        if (aNumericMatch && !bNumericMatch) return -1;
        if (!aNumericMatch && bNumericMatch) return 1;
        if (aNumericMatch && bNumericMatch) {
            const aNumber = parseInt(aNumericMatch[0]);
            const bNumber = parseInt(bNumericMatch[0]);
            if (aNumber > bNumber) return 1;
            if (aNumber < bNumber) return -1;
            aIndex += aNumericMatch[0].length;
            bIndex += bNumericMatch[0].length;
        }
        // otherwise just compare characters directly
        const aChar = a[aIndex];
        const bChar = b[bIndex];
        if (aChar && !bChar) return 1;
        if (!aChar && bChar) return -1;
        if (aChar !== bChar) return aChar.charCodeAt(0) - bChar.charCodeAt(0);
        aIndex++;
        bIndex++;
    }
    return 0;
}

/**
 * Compares two import declarations by their line count.
 * The one with fewer lines comes first. If equal, sorts alphabetically.
 */
export function sortByLineCount(a: ImportDeclaration, b: ImportDeclaration) {
    const lenA = (a.end || 0) - (a.start || 0);
    const lenB = (b.end || 0) - (b.start || 0);
    if (lenA !== lenB) return lenA - lenB;
    // If line counts are equal, sort alphabetically
    return naturalSort(a.source.value, b.source.value);
}
