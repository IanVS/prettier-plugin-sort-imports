import type { PrettierOptions } from '../types';

// No extra options at this time!
export type NaturalSortOptions = {}; // Pick<PrettierOptions, ''>;

export function naturalSort(
    a: string,
    b: string,
    { }: NaturalSortOptions,
): number {
    const left = typeof a === 'string' ? a : String(a);

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator#syntax
    const sortOptions: Intl.CollatorOptions = {
        sensitivity: 'base',
        numeric: true,
        caseFirst: 'lower',
    };

    return left.localeCompare(b, 'en', sortOptions);
}
