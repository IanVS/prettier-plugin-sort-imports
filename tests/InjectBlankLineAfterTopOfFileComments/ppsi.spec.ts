import {run_spec} from '../../test-setup/run_spec';

run_spec(__dirname, ['typescript'], {
    importOrder: [
        '', // Empty string here signifies blank line after top-of-file-comments
        '<BUILTIN_MODULES>',
        '<THIRD_PARTY_MODULES>',
        '',
        '^@core/(.*)$',
        '^@server/(.*)',
        '^@ui/(.*)$',
        '',
        '^[./]',
    ],
});
