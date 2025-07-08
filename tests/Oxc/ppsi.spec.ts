import {run_spec} from '../../test-setup/run_spec';

run_spec(__dirname, ["oxc"], {
    importOrder: [ "<THIRD_PARTY_MODULES>", '^@core/(.*)$', '^@server/(.*)', '^@ui/(.*)$', '^[./]'],
    importOrderParserPlugins : ['[\"importAttributes\", {\"deprecatedAssertSyntax\": true}]', 'jsx'],
});
