/* eslint-env node */
module.exports = {
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	rules: {
		'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': [
			'error',
			{
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
			},
		],
		'prettier/prettier': [
			'error',
			{
				singleQuote: true,
				trailingComma: 'all',
				printWidth: 80,
				tabWidth: 2,
				semi: true,
			},
		],
		'prefer-const': 'error',
		'no-duplicate-imports': 'error',
		'@typescript-eslint/explicit-function-return-type': 'off',
	},
};
