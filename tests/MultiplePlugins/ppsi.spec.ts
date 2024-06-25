import {run_spec} from '../../test-setup/run_spec';
import * as plugin from '../../src';

run_spec(__dirname, ["typescript"], {
    // Note, this is the only order that works in tests, because tailwind looks for published plugins,
    // and jsdoc throws a maximum call stack size exceeded error if it comes after tailwind.
    plugins: [
        'prettier-plugin-jsdoc',
        "prettier-plugin-tailwindcss",
        plugin,
    ],
    importOrder: ['^@core/(.*)$', '^@server/(.*)', '^@ui/(.*)$', '^[./]'],

});
