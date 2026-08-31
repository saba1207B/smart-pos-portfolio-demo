export default [
    {
        ignores: ["dist/", "node_modules/"]
    },
    {
        files: ["src/**/*.jsx", "src/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            },
            globals: {
                window: "readonly",
                document: "readonly",
                localStorage: "readonly",
                crypto: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                Date: "readonly",
                Math: "readonly",
                console: "readonly",
                EventSource: "readonly"
            }
        },
        rules: {
            "no-undef": "error"
        }
    }
];
