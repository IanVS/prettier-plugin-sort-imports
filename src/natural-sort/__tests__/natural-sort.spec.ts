import { expect, test } from 'vitest';

import { naturalSort } from '..';

test('should sort normal things alphabetically', () => {
    expect(
        ['a', 'h', 'b', 'i', 'c', 'd', 'j', 'e', 'k', 'f', 'g'].sort((a, b) =>
            naturalSort(a, b),
        ),
    ).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']);
});

test('should ignore capitalization differences', () => {
    // We have no option to cause case-sensitive sorting, so this is the "default" case!
    expect(
        ['./ExampleView', './ExamplesList'].sort((a, b) => naturalSort(a, b)),
    ).toEqual(['./ExamplesList', './ExampleView']);
});

test('should sort things numerically', () => {
    expect(
        ['a2', 'a3', 'a10', 'a1', 'a11', 'a9'].sort((a, b) =>
            naturalSort(a, b),
        ),
    ).toEqual(['a1', 'a2', 'a3', 'a9', 'a10', 'a11']);
});
