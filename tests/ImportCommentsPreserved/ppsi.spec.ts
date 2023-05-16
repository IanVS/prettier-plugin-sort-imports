import {run_spec} from '../../test-setup/run_spec';

run_spec(__dirname, ["typescript"], {
    importOrder: ['^@core/(.*)$', '^@server/(.*)', '^@ui/(.*)$', '^[./]'],
    importOrderTypeScriptVersion: "5.0.0",
    importOrderParserPlugins : ['typescript', 'decorators-legacy', 'classProperties']
});
