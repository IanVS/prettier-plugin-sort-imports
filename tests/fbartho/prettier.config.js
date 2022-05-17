module.exports = {
	printWidth: 100,
	semi: true,
	singleQuote: false, // Single quotes are common in text-strings
	trailingComma: "all", // Improves refactoring / minimizes git-conflicts
	tabWidth: 2,
	useTabs: true,
	// @ianvs/prettier-plugin-sort-imports
	importOrder: ["^@hca", "^[.]+"],
	importOrderBuiltinModulesToTop: true,
	importOrderCaseInsensitive: true,
	importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
	importOrderSeparation: true,
	importOrderSortSpecifiers: true,
};
