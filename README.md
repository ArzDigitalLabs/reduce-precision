

# reduce-precision

[![Known Vulnerabilities](https://snyk.io/test/github/ArzDigitalLabs/reduce-precision/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ArzDigitalLabs/reduce-precision?targetFile=package.json)
[![Build Status](https://travis-ci.org/ArzDigitalLabs/reduce-precision.svg?branch=master)](https://travis-ci.org/ArzDigitalLabs/reduce-precision)
[![codecov.io Code Coverage](https://img.shields.io/codecov/c/github/ArzDigitalLabs/reduce-precision.svg?maxAge=2592000)](https://codecov.io/github/ArzDigitalLabs/reduce-precision?branch=master)
[![Code Climate](https://codeclimate.com/github/ArzDigitalLabs/reduce-precision/badges/gpa.svg)](https://codeclimate.com/github/ArzDigitalLabs/reduce-precision)
[![NPM Version](https://badge.fury.io/js/reduce-precision.svg?style=flat)](https://npmjs.org/package/reduce-precision)

`reduce-precision` is a versatile package for formatting and reducing the precision of numbers, currencies, and percentages. It supports various templates, precision levels, languages, and output formats, making it easy to generate formatted strings for different use cases.

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

### Node.js / TypeScript

You can install `reduce-precision` using npm:

```bash
npm install reduce-precision
```

[![NPM Download Stats](https://nodei.co/npm/reduce-precision.png?downloads=true)](https://www.npmjs.com/package/reduce-precision)

### PHP

You can install the PHP version of `reduce-precision` via Composer:

```bash
composer require amirhosseinfaghan/reduce-precision
```

## Usage

### Node.js / TypeScript

```typescript
import { NumberFormatter } from 'reduce-precision';

const formatter = new NumberFormatter();

formatter.setLanguage('en', { prefixMarker: 'strong', prefix: 'USD ' });

console.log(formatter.toHtmlString(123456789));
console.log(formatter.toJson(123456789));
console.log(formatter.toString(123456789));
```

### PHP

```php
require 'vendor/autoload.php';

use NumberFormatter\NumberFormatter;

$formatter = new NumberFormatter();
echo $formatter->toString(12345.678); // Default format
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

### TypeScript/Node.js

```typescript
import { NumberFormatter } from 'reduce-precision';

// Create a formatter instance with default options
const formatter = new NumberFormatter();

// Basic usage
formatter.setLanguage('en');

// Basic number formatting
formatter.toJson(1234.5678); // Output: { value: '1,234.6', ... }

// Formatting with medium precision
formatter.setTemplate('number', 'medium').toJson(1234.5678); // Output: { value: '1.23K', ... }

// Formatting as USD
formatter.setTemplate('usd', 'high').toJson(1234.5678); // Output: { value: '$1,234.6', ... }

// Formatting as Iranian Rial with Persian numerals
formatter.setLanguage('fa');
formatter.setTemplate('irr', 'medium').toJson(1234.5678); // Output: { value: '۱٫۲۳ هزار ریال', ... }

// Formatting as a percentage with low precision
formatter.setTemplate('percent', 'low').toJson(0.1234); // Output: { value: '0.12%', ... }

// Formatting with HTML output and custom markers
formatter
  .setLanguage('en', { prefixMarker: 'strong', prefix: 'USD ' })
  .toHtmlString(1234.5678);
// Output: <strong>USD </strong>1,234.6

// Formatting with string input for small or big numbers
formatter.setTemplate('usd', 'medium').toJson('0.00000000000000000000005678521');
// Output: { value: '$0.0₂₂5678', ... }
```

### PHP

```php
require 'vendor/autoload.php';

use NumberFormatter\NumberFormatter;

$formatter = new NumberFormatter();
echo $formatter->toString(12345.678); // Default format

$formatter->setLanguage('fa');
echo $formatter->toString(12345.678); // Output in Persian

$formatter->setTemplate('usd', 'high');
echo $formatter->toString(12345.678); // Output in USD format with high precision

echo $formatter->toHtmlString(12345.678);  // HTML formatted output
echo $formatter->toMdString(12345.678);    // Markdown formatted output
```

## API

### `FormattedObject` Interface (TypeScript/Node.js)

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

### `NumberFormatter` Class (PHP)

#### `constructor`

Creates a new instance of the `NumberFormatter` class with optional configuration options.

#### `setLanguage`

Sets the language and optional language configuration for the formatter.

#### `setTemplate`

Sets the template and precision for the formatter.

#### `toString`

Formats the input number as a string.

#### `toPlainString`

Formats the input number as a plain text string.

#### `toHtmlString`

Formats the input number as an HTML string.

#### `toMdString`

Formats the input number as a Markdown string.

## Testing

### Node.js / TypeScript

You can run tests using Jest or any other preferred testing framework for TypeScript.

### PHP

You can run tests using PHPUnit:

```bash
./vendor/bin/phpunit tests
```

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue on the [GitHub repository](https://github.com/ArzDigitalLabs/reduce-precision). If you'd like to contribute code, please fork the repository and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

---
