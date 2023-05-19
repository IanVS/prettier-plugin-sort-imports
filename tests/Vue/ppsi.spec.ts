import {run_spec} from '../../test-setup/run_spec';

run_spec(__dirname, ["vue"], {
    importOrder: [
        '<THIRD_PARTY_MODULES>',
        '',
        '^@core/(.*)$',
        '',
        '^@server/(.*)',
        '',
        '^@ui/(.*)$',
        '',
        '^[./]',
    ],
});
