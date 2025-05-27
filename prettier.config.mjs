export default {
    printWidth: 80,
    tabWidth: 4,
    trailingComma: 'all',
    singleQuote: true,
    bracketSameLine: true,
    semi: true,
    plugins: ['./lib/src/index.js'],
    importOrder: [
        '',
        '<BUILTIN_MODULES>',
        '',
        '<THIRD_PARTY_MODULES>',
        '',
        '^[./]',
    ],
    importOrderTypeScriptVersion: '5.0.0',
};
