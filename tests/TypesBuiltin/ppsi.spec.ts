import {run_spec} from '../../test-setup/run_spec';

run_spec(__dirname, ["typescript"], {
    importOrder: [
        "<TYPES>^(node:)",
        "<BUILTIN_MODULES>",
        "",
        "<TYPES>",
        "<THIRD_PARTY_MODULES>",
        "",
        "<TYPES>^[.]",
        "^[.]",
      ],
    importOrderParserPlugins : ['typescript'],
});
