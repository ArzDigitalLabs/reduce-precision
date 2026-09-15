

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
- Optional inline Toman SVG and structured parts for custom UI rendering (JavaScript/TypeScript)

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
composer require arzdigitallabs/reduce-precision
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

The JavaScript/TypeScript `NumberFormatter` constructor accepts an optional `options` object with the following properties:

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
| `currencySymbol` | `'text'` \| `'svg'` | `'text'` | Toman symbol style for HTML output (JavaScript/TypeScript) |

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

## Rial compact formatting

The `irr` template keeps Rial units when precision compresses large amounts.
This applies to both JavaScript/TypeScript and PHP. Persian compact output uses
`ر` (for example, `میلیون ر`), and the JavaScript JSON `fullPostfix` uses `ریال`.
Trillion-scale Rial values use `هزار میلیارد ر`; `همت` remains specific to Toman.

```ts
const rial = new NumberFormatter({ template: 'irr', precision: 'medium' })
  .setLanguage('fa');

rial.toPlainString(1234567); // '۱٫۲۳ میلیون ر'
rial.toHtmlString(1234567);  // '۱٫۲۳<i> میلیون ر</i>'
```

The corrected labels apply to plain text, HTML, Markdown, JSON, and the parts
preview. The Toman SVG option does not change Rial output.

## Toman SVG (TypeScript / JavaScript)

Opt in to the bundled icon for HTML output:

```ts
import { NumberFormatter, tomanSymbolSvg } from 'reduce-precision';

const formatter = new NumberFormatter({
  template: 'irt',
  currencySymbol: 'svg', // default: 'text'
}).setLanguage('fa');

formatter.toHtmlString(12500); // localized amount with inline Toman SVG
formatter.toPlainString(12500); // existing text representation
const parts = formatter.formatToParts(12500);
```

Plain text, Markdown, other templates, and the existing JSON contract retain their
behavior. `toString()` follows the selected output format, as before. The icon uses
`currentColor`, a `1em` size, an accessible Toman label, and `.rp-currency-symbol` for styling.
SVG output escapes custom affix text. HTML markers support `i`, `b`, `em`,
`strong`, `span`, `small`, `sup`, and `sub`; other markers fall back to `span`
when SVG output is enabled.

`formatToParts()` returns `{ type, value }` objects. IRT parts separate `sign`,
`prefix`, `number`, `compact`, `currency`, `postfix`, and spacing (`literal`).
Render text parts as text nodes and replace the currency part with the exported
`tomanSymbolSvg` or your framework component. Compact parts explicitly separate
scale and currency (for example, `هزار میلیارد` and `ت` instead of `همت`), so joining
parts may differ from legacy plain output. Other templates currently return a
single `literal` part. Invalid/empty input returns an empty array.

This feature is currently available in the JavaScript/TypeScript implementation;
the PHP implementation is unchanged.

### Render parts in a browser

```ts
const output = document.querySelector('#price')!;
output.replaceChildren();

for (const part of formatter.formatToParts(12500)) {
  if (part.type === 'currency') {
    // Parse only the bundled SVG, never user-provided text.
    const icon = new DOMParser()
      .parseFromString(tomanSymbolSvg, 'image/svg+xml').documentElement;
    output.appendChild(document.importNode(icon, true));
  } else {
    output.appendChild(document.createTextNode(part.value));
  }
}
```

The exported `FormatPart` TypeScript type describes each part. Calling
`formatToParts()` does not change the formatter's selected output mode.

## Local demo

From a checkout of this repository:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. Select **Toman**, choose **Text** or **SVG icon**,
and switch between **HTML**, **Plain**, **Markdown**, and **Parts preview**.
The demo displays the rendered result, raw output, and formatted object or parts.
Plain and Markdown remain textual even when SVG is selected.

Build the package and demo:

```bash
npm run typecheck
npm test -- --runInBand
npm run build
npm run demo:build
npm run demo:preview
```

The demo build is written to `demo-dist/` and is excluded from Git.

## Testing

### Node.js / TypeScript

You can run tests using Jest or any other preferred testing framework for TypeScript.

### PHP

You can run tests using PHPUnit:

```bash
./vendor/bin/phpunit php/tests/NumberFormatterTest.php
```

Run the standalone Rial regression check without PHPUnit:

```bash
php php/tests/rial-regression.php
```

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue on the [GitHub repository](https://github.com/ArzDigitalLabs/reduce-precision). If you'd like to contribute code, please fork the repository and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
