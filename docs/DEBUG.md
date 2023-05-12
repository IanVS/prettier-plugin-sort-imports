## Debugging

---

### How to run example in the repository ?

```shell
yarn run example examples/example.ts --config examples/.prettierrc
```

### How to debug the plugin using node `debugger` ?

You can set a `debugger` anywhere in the code and then use following command:

```shell
yarn run compile && node --inspect-brk ./node_modules/.bin/prettier --config examples/.prettierrc --plugin lib/src/index.js examples/example.ts
```

### How to debug the unit test using `debugger` ?

You can set a `debugger` anywhere in the code and then use following command:

```shell
node --inspect-brk ./node_modules/.bin/vitest --run
```

Or, to debug a single unit test file

```shell
 node --inspect-brk ./node_modules/.bin/vitest --run <name-or-relative-path-of-the-file-file>
```

### How to run prettier in any codebase using the plugin ?

First, install the `@ianvs/prettier-plugin-sort-imports` and then use following command:

```shell
./node_modules/.bin/prettier --write '**/*.{ts,tsx,js}'
```
