module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: null,
    ecmaVersion: 6,
    sourceType: "module"
  },
  env: {
    es6: true,
    node: true
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "prettier/@typescript-eslint"
  ],
  rules: {
    "prettier/prettier": "error",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/explicit-member-accessibility": "off",
    "@typescript-eslint/class-name-casing": "off",
    "@typescript-eslint/no-parameter-properties": "off",
    "@typescript-eslint/no-object-literal-type-assertion": "off",
    "@typescript-eslint/no-this-alias": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    // "no-console": ["error", { allow: ["error"] }],
    "no-empty": "off",
    "require-atomic-updates": "off"
  }
};
