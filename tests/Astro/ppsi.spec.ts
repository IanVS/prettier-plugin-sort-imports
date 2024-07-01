import * as plugin from '../../src';
import { run_spec } from '../../test-setup/run_spec';

run_spec(__dirname, ['astro'], {
    plugins: ['prettier-plugin-astro', plugin],
    importOrder: [
        '<TYPES>',
        '<BUILT_IN_MODULES>',
        '<THIRD_PARTY_MODULES>',
        '^[./]',
    ],
});
