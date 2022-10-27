run_spec(__dirname, ['typescript'], {
    importOrder: [
        '<TYPES>',
        '<THIRD_PARTY_MODULES>',
        '<TYPES>^[./]',
        '^[./]',
    ],
    importOrderSeparation: true,
    importOrderMergeDuplicateImports: true,
    importOrderParserPlugins: ['typescript'],
});
