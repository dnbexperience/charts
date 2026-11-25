import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import hooks from 'eslint-plugin-react-hooks'
import a11y from 'eslint-plugin-jsx-a11y'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist/**', '.release/**', '.pages/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true },
      ],
    },
  },
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ['site/**/*.tsx'],
    plugins: { 'react-hooks': hooks, 'jsx-a11y': a11y },
    rules: {
      ...hooks.configs.recommended.rules,
      ...a11y.configs.recommended.rules,
    },
  }
)
