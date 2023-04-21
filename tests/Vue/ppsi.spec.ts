import {run_spec} from '../../test-setup/run_spec';

run_spec(__dirname, ["vue"], {
    importOrder: ['^@core/(.*)$', '^@server/(.*)', '^@ui/(.*)$', '^[./]'],
    importOrderSeparation: true,
});
