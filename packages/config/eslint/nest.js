/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./base.js'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: process.cwd(),
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
  },
};
