import { expect, test, describe } from 'vitest';

import { naturalSort, naturalSortCaseSensitive } from '..';

describe('naturalSort', () => {
    test('should sort normal things alphabetically', () => {
        expect(
            ['a', 'h', 'b', 'i', 'c', 'd', 'j', 'e', 'k', 'f', 'g'].sort((a, b) =>
                naturalSort(a, b),
            ),
        ).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']);
    });

    test('should ignore capitalization differences', () => {
        expect(
            ['./ExampleComponent', './ExamplesList', './ExampleWidget'].sort(
                (a, b) => naturalSort(a, b),
            ),
        ).toEqual(['./ExampleComponent', './ExamplesList', './ExampleWidget']);
    });

    test('should sort things numerically', () => {
        expect(['a2', 'a3', 'a10', 'a1', 'a11', 'a9'].sort(naturalSort)).toEqual([
            'a1',
            'a2',
            'a3',
            'a9',
            'a10',
            'a11',
        ]);
    });
})

describe('naturalSortCaseSensitive', () => {
    test('should not ignore capitalization differences', () => {
        expect(
            ['./ExampleComponent', './ExamplesList', './ExampleWidget'].sort(
                (a, b) => naturalSortCaseSensitive(a, b),
            ),
        ).toEqual(['./ExampleComponent', './ExampleWidget', './ExamplesList']);
    });

    test('should sort numerically and case-sensitively', () => {
        expect(
            [
                'file1',
                'File10',
                'AbA',
                'file10',
                'files10',
                'a',
                'Ab',
                'file20',
                'file22',
                'file11',
                'file2',
                'File20',
                'aaa',
                'AAA',
                'bBb',
                'BBB',
            ].sort(naturalSortCaseSensitive),
        ).toEqual([
            'AAA',
            'Ab',
            'AbA',
            'BBB',
            'File10',
            'File20',
            'a',
            'aaa',
            'bBb',
            'file1',
            'file2',
            'file10',
            'file11',
            'file20',
            'file22',
            'files10',
        ]);
    });
});
