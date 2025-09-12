import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import globals from "globals";

import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for NestJS backend apps.
 *
 * @type {import("eslint").Linter.FlatConfig[]}
 */
export const nestConfig = [
  ...baseConfig,

  // Base JS rules
  js.configs.recommended,

  // TypeScript support
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Prettier for code formatting
  eslintConfigPrettier,

  // Global variables for Node
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Custom NestJS rules (add more if needed)
  {
    files: ["*.ts"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
