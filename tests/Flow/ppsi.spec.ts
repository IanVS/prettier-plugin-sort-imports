import {run_spec} from '../../test-setup/run_spec';

run_spec(__dirname, ['flow'], {
    importOrder: ['^@core/(.*)$', '^@server/(.*)', '^@ui/(.*)$', '^[./]'],
    importOrderSeparation: true,
    importOrderParserPlugins: ['flow'],
    importOrderMergeDuplicateImports: true,
    importOrderCombineTypeAndValueImports: true,
});
