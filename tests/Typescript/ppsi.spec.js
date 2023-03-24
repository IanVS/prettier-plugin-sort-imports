run_spec(__dirname, ["typescript"], {
    importOrder: ['^@core/(.*)$', '^@server/(.*)', '^@ui/(.*)$', '^[./]'],
    importOrderSeparation: true,
    importOrderParserPlugins : ['typescript', 'decorators-legacy', 'classProperties'],
    importOrderMergeDuplicateImports: true,
    importOrderCombineTypeAndValueImports: true,
});
