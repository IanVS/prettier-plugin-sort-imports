import {run_spec} from '../../test-setup/run_spec';

run_spec(__dirname, ['typescript'], {
    importOrder: ['^server-only$', '<THIRD_PARTY_MODULES>', '^(?!.*\.css$)\./.*$', '\.css$'],
    importOrderSafeSideEffects: ['^\./.*\.css?', '^server-only$'],
    importOrderParserPlugins: ['typescript']
});
