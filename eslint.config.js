import antfu from '@antfu/eslint-config'

export default antfu(
  {
    vue: true,
    typescript: true,
    ignores: ['src/**/*.json', 'shims.d.ts', 'onelabeler.d.ts'],
  },
  {
    files: ['src/**/*.vue', 'src/**/*.ts', 'test/**/*.ts', 'e2e/**/*.ts', 'playwright.config.ts'],
    rules: {
      'arrow-parens': ['error', 'always'],
      'style/arrow-parens': ['error', 'always'],
      'curly': ['error', 'multi-line'],
      'antfu/if-newline': ['off'],
      'antfu/top-level-function': ['off'],
    },
  },
  {
    // @antfu/eslint-config wants trustPolicy: no-downgrade, which currently
    // blocks install via oxc-resolver trust-downgrade under unplugin-vue-macros.
    files: ['pnpm-workspace.yaml'],
    rules: {
      'pnpm/yaml-enforce-settings': 'off',
    },
  },
)
