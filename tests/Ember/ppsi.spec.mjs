import * as plugin from '../../src';
import { run_spec } from '../../test-setup/run_spec';

run_spec(__dirname, ['ember-template-tag'], {
    importOrder: [
        '<BUILTIN_MODULES>',
        '',
        '^@core/(.*)$',
        '',
        '^@server/(.*)',
        '',
        '^@ui/(.*)$',
        '',
        '^[./]',
    ],
    plugins: ['prettier-plugin-ember-template-tag', plugin],
});