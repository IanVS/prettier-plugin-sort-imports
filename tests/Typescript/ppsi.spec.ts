import {run_spec} from '../../test-setup/run_spec';

run_spec(__dirname, ["typescript"], {
    importOrder: ['^@core/(.*)$', '^@server/(.*)', '^@ui/(.*)$', '^[./]'],
    importOrderParserPlugins : ['typescript', 'jsx', 'decorators-legacy', 'classProperties'],
});
