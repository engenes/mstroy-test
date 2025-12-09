import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-multi-spaces': ['error'],
      'array-bracket-spacing': ['error'],
      'space-in-parens': ['error'],
      'vue/attribute-hyphenation': ['error'],
      'computed-property-spacing': ['error'],
      'key-spacing': ['error'],
      'vue/html-indent': ['error'],
      'vue/valid-v-slot': ['error', { allowModifiers: true }],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      }],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'block' },
        { blankLine: 'always', prev: 'block', next: '*' },
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: '*', next: 'continue' },
        { blankLine: 'always', prev: '*', next: 'if' },
        { blankLine: 'always', prev: 'if', next: '*' },
        { blankLine: 'always', prev: '*', next: 'export' },
      ],
      'object-curly-spacing': ['error', 'always'],
      'semi': ['error', 'always', { omitLastInOneLineBlock: true }],
      'arrow-parens': ['error', 'always'],
      'comma-spacing': ['error', { before: false, after: true }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'prefer-promise-reject-errors': ['error', { allowEmptyReject: true }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'vue/return-in-computed-property': 'off',
      'vue/multi-word-component-names': 'off',
      'space-before-function-paren': ['error', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always',
      }],
      'vue/max-attributes-per-line': ['warn', { singleline: { max: 3 } }],
      'vue/require-default-prop': 'off',
      'vue/no-mutating-props': 'warn',
      'no-restricted-syntax': ['error', {
        message: 'Use afterEach!',
        selector: 'VariableDeclaration[kind="const"] > VariableDeclarator > Identifier[name="wrapper"]',
      }],
      'no-use-before-define': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn'],
      'space-infix-ops': 'error',
      'space-before-blocks': 'error',
      'arrow-spacing': 'error',
      'keyword-spacing': ['error', { before: true }],
      'vue/singleline-html-element-content-newline': ['error'],
      'vue/new-line-between-multi-line-property': ['error', { minLineOfMultilineProperty: 2 }],
      'vue/padding-line-between-blocks': ['error'],
      'quotes': ['error', 'single'],
      'vue/attributes-order': ['error', {
        order: [
          'DEFINITION',
          'LIST_RENDERING',
          'CONDITIONALS',
          'RENDER_MODIFIERS',
          'GLOBAL',
          ['UNIQUE', 'SLOT'],
          'TWO_WAY_BINDING',
          'OTHER_DIRECTIVES',
          'OTHER_ATTR',
          'EVENTS',
          'CONTENT',
        ],
        alphabetical: false,
      }],
    },
  }
)
