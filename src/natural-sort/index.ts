import type { PrettierOptions } from '../types';

export type NaturalSortOptions = Partial<
    Pick<PrettierOptions, 'importOrderCaseInsensitive'>
>;

export function naturalSort(
    a: string,
    b: string,
    { importOrderCaseInsensitive }: NaturalSortOptions,
): number {
    const left = typeof a === 'string' ? a : String(a);

    if (!importOrderCaseInsensitive) {
        return left < b ? -1 : left > b ? 1 : 0;
    }

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator#syntax
    const sortOptions: Intl.CollatorOptions = {
        sensitivity: 'base',
        numeric: true,
        caseFirst: 'lower',
    };

    return left.localeCompare(b, 'en', sortOptions);
}
