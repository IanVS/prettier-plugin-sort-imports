module.exports = {
    printWidth: 80,
    tabWidth: 4,
    trailingComma: 'all',
    singleQuote: true,
    bracketSameLine: true,
    semi: true,
    plugins: [require('./lib/src/index.js')],
    importOrder: ['<THIRD_PARTY_MODULES>', '', '^[./]'],
    importOrderSortSpecifiers: true,
};
