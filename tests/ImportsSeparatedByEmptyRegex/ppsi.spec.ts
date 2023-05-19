import {run_spec} from '../../test-setup/run_spec';

run_spec(__dirname, ['typescript'], {
    importOrder: [
        // '<BUILTIN_MODULES>',     // This is injected by options normalization
        '<THIRD_PARTY_MODULES>',
        '',
        '^@core/(.*)$',
        '^@server/(.*)',
        '^@ui/(.*)$',
        '',
        '^[./]',
    ],
});
