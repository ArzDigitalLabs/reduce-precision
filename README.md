# reduce-precision

[![Known Vulnerabilities](https://snyk.io/test/github/ArzDigitalLabs/reduce-precision/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ArzDigitalLabs/reduce-precision?targetFile=package.json)
[![Build Status](https://travis-ci.org/ArzDigitalLabs/reduce-precision.svg?branch=master)](https://travis-ci.org/ArzDigitalLabs/reduce-precision)
[![codecov.io Code Coverage](https://img.shields.io/codecov/c/github/ArzDigitalLabs/reduce-precision.svg?maxAge=2592000)](https://codecov.io/github/ArzDigitalLabs/reduce-precision?branch=master)
[![Code Climate](https://codeclimate.com/github/ArzDigitalLabs/reduce-precision/badges/gpa.svg)](https://codeclimate.com/github/ArzDigitalLabs/reduce-precision)
[![NPM Version](https://badge.fury.io/js/reduce-precision.svg?style=flat)](https://npmjs.org/package/reduce-precision)

`reduce-precision` is a versatile JavaScript/TypeScript package for formatting and reducing the precision of numbers, currencies, and percentages. It supports various templates, precision levels, languages, and output formats, making it easy to generate formatted strings for different use cases.

## Features

- Format numbers with customizable precision levels: high, medium, low, or auto
- Support for multiple templates: number, USD, IRT (Iranian Toman), IRR (Iranian Rial), and percent
- Multilingual support: English and Persian (Farsi)
- Output formats: plain text, HTML, and Markdown
- Customizable prefix and postfix markers for HTML and Markdown output
- Intelligent handling of very small and very large numbers
- Automatic thousand separators and decimal points based on the selected language
- TypeScript type definitions included

## Installation

You can install `reduce-precision` using npm:

```bash
npm install reduce-precision
```

[![NPM Download Stats](https://nodei.co/npm/reduce-precision.png?downloads=true)](https://www.npmjs.com/package/reduce-precision)

## Usage

### JavaScript (CommonJS)

```javascript
const { format } = require('reduce-precision');

const formatted = format(123456, options);
```

### TypeScript or ES Modules

```typescript
import { format } from 'reduce-precision';

const formatted = format(123456, options);
```

## Options

The `format` function accepts an optional `options` object with the following properties:

| Option        | Type                                        | Default   | Description                                                        |
| ------------- | ------------------------------------------- | --------- | ------------------------------------------------------------------ |
| `precision`   | `'auto'` \| `'high'` \| `'medium'` \| `'low'` | `'high'`   | Precision level for formatting                                     |
| `template`    | `'number'` \| `'usd'` \| `'irt'` \| `'irr'` \| `'percent'` | `'number'` | Template for formatting                                            |
| `language`    | `'en'` \| `'fa'`                              | `'en'`     | Language for formatting (English or Persian)                       |
| `outputFormat` | `'plain'` \| `'html'` \| `'markdown'`          | `'plain'`  | Output format                                                      |
| `prefixMarker` | `string`                                    | `'i'`      | Prefix marker for HTML and Markdown output                         |
| `postfixMarker` | `string`                                    | `'i'`      | Postfix marker for HTML and Markdown output                        |
| `prefix`       | `string`                                    | `''`       | Prefix string to be added before the formatted number              |
| `postfix`      | `string`                                    | `''`       | Postfix string to be added after the formatted number              |

## Examples

```typescript
import { format } from 'reduce-precision';

// Basic number formatting
format(1234.5678); // Output: 1,234.5678

// Formatting with medium precision
format(1234.5678, { precision: 'medium' }); // Output: 1,234.57

// Formatting as USD
format(1234.5678, { template: 'usd' }); // Output: $1,234.5678

// Formatting as Iranian Rial with Persian numerals
format(1234.5678, { template: 'irr', language: 'fa' }); // Output: ۱٬۲۳۴٫۵۷ ر

// Formatting as a percentage with low precision
format(0.1234, { template: 'percent', precision: 'low' }); // Output: 12%

// Formatting with HTML output and custom markers
format(1234.5678, { outputFormat: 'html', prefixMarker: 'strong', prefix: 'USD ' });
// Output: <strong>USD </strong>1,234.5678

// Formatting with string input for small or big numbers
format("0.00000000000000000000005678521", { template: 'usd', precision: 'medium' });
// Output: $0.0₂₂5678
```

## TypeScript

`reduce-precision` is written in TypeScript and includes type definitions for all exported functions and interfaces.

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue on the [GitHub repository](https://github.com/ArzDigitalLabs/reduce-precision). If you'd like to contribute code, please fork the repository and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
