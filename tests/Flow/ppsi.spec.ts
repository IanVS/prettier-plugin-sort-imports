import {run_spec} from '../../test-setup/run_spec';

run_spec(__dirname, ['flow'], {
    importOrder: ['', '^@core/(.*)$', '', '^@server/(.*)', '', '^@ui/(.*)$', '', '^[./]'],
    importOrderParserPlugins: ['flow'],
    importOrderMergeDuplicateImports: true,
    importOrderCombineTypeAndValueImports: true,
});
