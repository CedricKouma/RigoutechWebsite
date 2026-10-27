import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["assets/vendor/**"],
  },
  js.configs.recommended,
  {
    files: ["assets/js/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
