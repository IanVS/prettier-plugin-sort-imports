import {run_spec} from '../../test-setup/run_spec';

run_spec(__dirname, ['typescript'], {
    importOrder: [
        // Never insert a blank-line below the top-of-file comments, so no empty string here.
        // '<BUILTIN_MODULES>',     // This is injected by options normalization
        // '<THIRD_PARTY_MODULES>', // This is injected by options normalization
        '',
        '^@core/(.*)$',
        '^@server/(.*)',
        '^@ui/(.*)$',
        '',
        '^[./]',
    ],
});
