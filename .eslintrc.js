module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-unused-vars': ['warn', { 
            'argsIgnorePattern': '^_',
            'varsIgnorePattern': '^_'
        }],
        'no-console': ['warn', { 
            allow: ['warn', 'error'] 
        }],
        'curly': 'error',
        'eqeqeq': 'error',
        'no-throw-literal': 'error',
        'strict': ['error', 'never'],
        'no-var': 'error',
        'dot-notation': 'error',
        'no-tabs': 'error',
        'no-trailing-spaces': 'error',
        'no-use-before-define': 'error',
        'no-unneeded-ternary': 'error',
        'no-const-assign': 'error',
        'prefer-const': 'error',
        'no-shadow': 'error',
        'no-useless-return': 'error',
        'no-useless-concat': 'error',
        'no-useless-constructor': 'error',
        'no-duplicate-imports': 'error',
        'space-before-blocks': 'error',
        'space-before-function-paren': ['error', {
            'anonymous': 'always',
            'named': 'never',
            'asyncArrow': 'always'
        }],
        'space-in-parens': ['error', 'never'],
        'space-infix-ops': 'error',
        'keyword-spacing': ['error', { 'before': true, 'after': true }],
        'comma-spacing': ['error', { 'before': false, 'after': true }],
        'comma-style': ['error', 'last'],
        'comma-dangle': ['error', 'never'],
        'semi-spacing': ['error', { 'before': false, 'after': true }],
        'rest-spread-spacing': ['error', 'never'],
        'no-multiple-empty-lines': ['error', { 'max': 1 }],
        'padded-blocks': ['error', 'never'],
        'arrow-spacing': ['error', { 'before': true, 'after': true }],
        'object-shorthand': ['error', 'always'],
        'prefer-template': 'error',
        'template-curly-spacing': ['error', 'never'],
        'prefer-destructuring': ['error', {
            'array': false,
            'object': true
        }],
        'prefer-rest-params': 'error',
        'prefer-spread': 'error',
        'prefer-arrow-callback': 'error',
        'arrow-body-style': ['error', 'as-needed'],
        'implicit-arrow-linebreak': ['error', 'beside']
    }
};
