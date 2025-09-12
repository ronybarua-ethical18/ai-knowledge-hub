import { config } from "@workspace/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    parserOptions: {
      project: "./tsconfig.json",
    },
  },
];
