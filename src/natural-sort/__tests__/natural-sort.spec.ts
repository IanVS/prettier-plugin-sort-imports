import { naturalSort } from '..';

it('should sort normal things alphabetically', () => {
    expect(
        ['a', 'h', 'b', 'i', 'c', 'd', 'j', 'e', 'k', 'f', 'g'].sort((a, b) =>
            naturalSort(a, b, { importOrderCaseInsensitive: false }),
        ),
    ).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']);
});

it('should treat capital letters as alphabetically earlier than lowercase if case sensitive (or unspecified)', () => {
    expect(
        ['./ExampleView', './ExamplesList'].sort((a, b) =>
            naturalSort(a, b, { importOrderCaseInsensitive: false }),
        ),
    ).toMatchInlineSnapshot(
        ['./ExampleView', './ExamplesList'],
        `
        Array [
          "./ExampleView",
          "./ExamplesList",
        ]
    `,
    );
    expect(
        ['./ExampleView', './ExamplesList'].sort((a, b) =>
            naturalSort(a, b, {}),
        ),
    ).toMatchInlineSnapshot(
        ['./ExampleView', './ExamplesList'],
        `
        Array [
          "./ExampleView",
          "./ExamplesList",
        ]
    `,
    );
});

it('should ignore capitalization differences if case-insensitive', () => {
    expect(
        ['./ExampleView', './ExamplesList'].sort((a, b) =>
            naturalSort(a, b, { importOrderCaseInsensitive: true }),
        ),
    ).toEqual(['./ExamplesList', './ExampleView']);
});

it('should sort things numerically', () => {
    expect(
        ['a2', 'a3', 'a10', 'a1', 'a11', 'a9'].sort((a, b) =>
            naturalSort(a, b, { importOrderCaseInsensitive: true }),
        ),
    ).toEqual(['a1', 'a2', 'a3', 'a9', 'a10', 'a11']);
});
