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
const { NumberFormatter } = require('reduce-precision');

const formatter = new NumberFormatter();

formatter.setLanguage('en', { prefixMarker: 'strong', prefix: 'USD ' });

console.log(formatter.toHtmlString(123456789));
console.log(formatter.toJson(123456789));
console.log(formatter.toString(123456789));
```

### TypeScript or ES Modules

```typescript
import { NumberFormatter } from 'reduce-precision';

const formatter = new NumberFormatter();

formatter.setLanguage('en', { prefixMarker: 'strong', prefix: 'USD ' });

console.log(formatter.toHtmlString(123456789));
console.log(formatter.toJson(123456789));
console.log(formatter.toString(123456789));
```

### Browser

```html
<script src="https://cdn.jsdelivr.net/npm/reduce-precision/lib/bundle.min.js"></script>
```

## Options

The `format` function accepts an optional `options` object with the following properties:

| Option          | Type                                                       | Default    | Description                                           |
| --------------- | ---------------------------------------------------------- | ---------- | ----------------------------------------------------- |
| `precision`     | `'auto'` \| `'high'` \| `'medium'` \| `'low'`              | `'high'`   | Precision level for formatting                        |
| `template`      | `'number'` \| `'usd'` \| `'irt'` \| `'irr'` \| `'percent'` | `'number'` | Template for formatting                               |
| `language`      | `'en'` \| `'fa'`                                           | `'en'`     | Language for formatting (English or Persian)          |
| `outputFormat`  | `'plain'` \| `'html'` \| `'markdown'`                      | `'plain'`  | Output format                                         |
| `prefixMarker`  | `string`                                                   | `'i'`      | Prefix marker for HTML and Markdown output            |
| `postfixMarker` | `string`                                                   | `'i'`      | Postfix marker for HTML and Markdown output           |
| `prefix`        | `string`                                                   | `''`       | Prefix string to be added before the formatted number |
| `postfix`       | `string`                                                   | `''`       | Postfix string to be added after the formatted number |

## Examples

```typescript
import { NumberFormatter } from 'reduce-precision';

// Create a formatter instance with default options
const formatter = new NumberFormatter();

// Create a formatter instance with custom options
const formatterWithOptions = new NumberFormatter({
  language: 'fa',
  template: 'irr',
  precision: 'medium',
  prefixMarker: 'strong',
  postfixMarker: 'em',
  prefix: 'مبلغ: ',
  postfix: ' ریال',
});

// Basic usage
formatter.setLanguage('en');

// Basic number formatting
formatter.toJson(1234.5678); // Output: { value: '1,234.6', ... }

// Formatting with medium precision
formatter.setTemplate('number', 'medium').toJson(1234.5678); // Output: { value: '1.23K', ... }

// Formatting as USD
formatter.setTemplate('usd', 'high').toJson(1234.5678); // Output: { value: '$1,234.6', ... }

// Formatting as Iranian Rial with Persian numerals
formatterWithOptions.toJson(1234.5678);
// Output: { value: 'مبلغ: ۱٫۲۳ هزار ت', ... }

// Formatting as a percentage with low precision
formatter.setTemplate('percent', 'low').toJson(0.1234); // Output: { value: '0.12%', ... }

// Formatting with HTML output and custom markers

formatter
  .setLanguage('en', { prefixMarker: 'strong', prefix: 'USD ' })
  .toHtmlString(1234.5678);
// Output: <strong>USD </strong>1,234.6

// Formatting with string input for small or big numbers

formatter
  .setTemplate('usd', 'medium')
  .toJson('0.00000000000000000000005678521');
// Output: { value: '$0.0₂₂5678', ... }
```

## API

### `FormattedObject` Interface

The `FormattedObject` interface represents the structure of the formatted number object returned by the `format` method.

```typescript
interface FormattedObject {
  value: string; // The formatted value as a string
  prefix: string; // The prefix string
  postfix: string; // The postfix string
  sign: string; // The sign of the number (either an empty string or '-')
  wholeNumber: string; // The whole number part of the value
}
```

### `NumberFormatter` Class

#### `constructor(options?: FormatterOptions)`

Creates a new instance of the `NumberFormatter` class with optional configuration options.

- `options` (optional): An object containing the initial configuration options for the formatter.

#### `setLanguage(lang: Language, config?: LanguageConfig): NumberFormatter`

Sets the language and optional language configuration for the formatter.

- `lang`: The language to be used for formatting (`'en'` for English or `'fa'` for Persian).
- `config` (optional): An object containing additional language configuration options.
  - `prefixMarker` (optional): The marker for the prefix in HTML or Markdown output (default: `'i'`).
  - `postfixMarker` (optional): The marker for the postfix in HTML or Markdown output (default: `'i'`).
  - `prefix` (optional): The prefix string to be added before the formatted number.
  - `postfix` (optional): The postfix string to be added after the formatted number.

Returns the `NumberFormatter` instance for method chaining.

#### `setTemplate(template: Template, precision: Precision): NumberFormatter`

Sets the template and precision for the formatter.

- `template`: The template to be used for formatting (`'number'`, `'usd'`, `'irt'`, `'irr'`, or `'percent'`).
- `precision`: The precision level for formatting (`'high'`, `'medium'`, `'low'`, or `'auto'`).

Returns the `NumberFormatter` instance for method chaining.

#### `toJson(input: string | number): FormattedObject`

Formats the input number and returns the formatted object.

- `input`: The number to be formatted, either as a string or a number.

Returns the formatted object.

#### `toHtmlString(): string`

Returns the formatted value as an HTML string.

#### `toString(): string`

Returns the formatted value as a plain string.

## TypeScript

`reduce-precision` is written in TypeScript and includes type definitions for all exported functions and interfaces.

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue on the [GitHub repository](https://github.com/ArzDigitalLabs/reduce-precision). If you'd like to contribute code, please fork the repository and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
