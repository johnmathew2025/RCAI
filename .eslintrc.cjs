/**
 * ESLint Configuration - ZERO HARDCODING ENFORCEMENT
 * Prevents absolute URLs and direct /api fetch calls
 */

module.exports = {
  extends: ["@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    // Prevent absolute URL hardcoding
    "no-restricted-syntax": [
      "error",
      {
        selector: "Literal[value=/^https?:\\/\\//]",
        message: "Absolute URL hardcoding is forbidden; use api() + runtime config."
      }
    ],
    // Prevent direct fetch calls to /api
    "no-restricted-properties": [
      "error",
      {
        object: "window",
        property: "fetch",
        message: "Use api() wrapper instead of direct fetch."
      }
    ],
    // Prevent hardcoded /api paths in strings
    "no-restricted-syntax": [
      "error",
      {
        selector: "Literal[value=/^\\/api\\//]",
        message: "Hardcoded /api/ paths forbidden; use api() wrapper."
      }
    ]
  }
};