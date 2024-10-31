import {expectError} from '../../test-setup/run_spec';

expectError(
    __dirname,
    "typescript",
    "Could not find a matching group in importOrder for: \"React\" on line 3",
    {
        importOrder: ['^[./]', '<TYPES>^#utils$', '<TYPES>[.]'],
        importOrderParserPlugins: ['typescript'],
    }
);
