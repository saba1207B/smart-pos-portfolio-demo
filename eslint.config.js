/*
Copyright (c) 2026 Sabareesh M (saba1207B). All Rights Reserved.

This source code is proprietary and confidential.

Unauthorized copying, redistribution, modification, or use — including
any use for artificial intelligence / machine learning training —
is strictly prohibited.

See the LICENSE and COPYRIGHT files in the repository root for full terms.
*/

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
