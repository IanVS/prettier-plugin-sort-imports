import * as plugin from '../../src';
import { run_spec } from '../../test-setup/run_spec';

run_spec(__dirname, ["svelte"], {
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
    plugins: ['prettier-plugin-svelte', plugin],
    "overrides": [{ "files": "*.svelte", "options": { "parser": "svelte" } }]
});
