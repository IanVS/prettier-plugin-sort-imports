run_spec(__dirname, ["typescript"], {
    importOrder: ["^react",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@(.*)",
    "^[./]"],
    importOrderSeparation: false,
    "trailingComma": "none",
});
