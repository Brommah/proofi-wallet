module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
    webextensions: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Best Practices
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Style
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'indent': ['error', 2, { SwitchCase: 1 }],
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // ES6+
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',
    'prefer-template': 'warn',
    'template-curly-spacing': ['error', 'never'],
    
    // Code Quality
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-throw-literal': 'error',
  },
  overrides: [
    {
      // Extension-specific rules
      files: ['extension/**/*.js'],
      env: {
        webextensions: true,
      },
      globals: {
        chrome: 'readonly',
      },
    },
    {
      // Config files
      files: ['*.config.js', '.eslintrc.js'],
      env: {
        node: true,
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    'playwright-report/',
    '*.min.js',
    'proofi/*.html', // Generated HTML files
  ],
};
