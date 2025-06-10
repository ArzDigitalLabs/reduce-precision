type Template = 'number' | 'usd' | 'irt' | 'irr' | 'percent' | 'incremental';
type Precision = 'auto' | 'high' | 'medium' | 'low';
type Language = 'en' | 'fa';
type OutputFormat = 'plain' | 'html' | 'markdown';

interface FormattedObject {
  value?: string;
  prefix: string;
  postfix: string;
  fullPostfix?: string;
  sign: string;
  wholeNumber: string;
}

interface LanguageConfig {
  prefixMarker?: string;
  postfixMarker?: string;
  prefix?: string;
  postfix?: string;
  thousandSeparator?: string;
  decimalSeparator?: string;
}

interface Options extends LanguageConfig {
  precision?: Precision;
  template?: Template;
  language?: Language;
  outputFormat?: OutputFormat;
}

class NumberFormatter {
  private readonly languageBaseConfig: LanguageConfig = {
    prefixMarker: 'i',
    postfixMarker: 'i',
    prefix: '',
    postfix: '',
  };

  private defaultLanguageConfig: { [key in Language]: LanguageConfig } = {
    en: {
      ...this.languageBaseConfig,
      thousandSeparator: ',',
      decimalSeparator: '.',
    },
    fa: {
      ...this.languageBaseConfig,
      thousandSeparator: '٬', // Correct: U+066C for thousands
      decimalSeparator: '٫',  // Correct: U+066B for decimal
    },
  };

  private options: Options = {
    language: 'en',
    template: 'number',
    precision: 'high',
    outputFormat: 'plain',
    ...this.defaultLanguageConfig['en'],
  };

  constructor(options: Options = {}) {
    this.options = { ...this.options, ...options };
  }
  setLanguage(lang: Language, config: LanguageConfig = {}): NumberFormatter {
    this.options.language = lang;
    this.options.prefixMarker =
      config.prefixMarker || this.defaultLanguageConfig[lang].prefixMarker;
    this.options.postfixMarker =
      config.postfixMarker || this.defaultLanguageConfig[lang].postfixMarker;
    this.options.prefix =
      config.prefix || this.defaultLanguageConfig[lang].prefix;
    this.options.postfix =
      config.postfix || this.defaultLanguageConfig[lang].postfix;
    this.options.thousandSeparator =
      config.thousandSeparator ||
      this.defaultLanguageConfig[lang].thousandSeparator;
    this.options.decimalSeparator =
      config.decimalSeparator ||
      this.defaultLanguageConfig[lang].decimalSeparator;
    return this;
  }

  setTemplate(template: Template, precision: Precision): NumberFormatter {
    this.options.template = template;
    this.options.precision = precision;
    return this;
  }

  toJson(input: string | number): FormattedObject {
    const formattedObject = this.format(input);
    delete formattedObject.value;

    return formattedObject;
  }

  toString(input: string | number): string {
    const formattedObject = this.format(input);
    return formattedObject.value || '';
  }

  toPlainString(input: string | number): string {
    this.options.outputFormat = 'plain';
    const formattedObject = this.format(input);
    return formattedObject.value || '';
  }

  toHtmlString(input: string | number): string {
    this.options.outputFormat = 'html';
    const formattedObject = this.format(input);
    return formattedObject.value || '';
  }

  toMdString(input: string | number): string {
    this.options.outputFormat = 'markdown';
    const formattedObject = this.format(input);
    return formattedObject.value || '';
  }

  // Private methods...
  private isENotation(input: string): boolean {
    return /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)$/.test(input);
  }

  private format(input: string | number): FormattedObject {
    let { precision, template } = this.options;

    const {
      language,
      outputFormat,
      prefixMarker,
      postfixMarker,
      prefix,
      postfix,
      thousandSeparator,
      decimalSeparator,
    } = this.options;

    if (input === undefined || input === null || input === '') {
      return {} as FormattedObject;
    }

    // Store original input string to preserve format for trailing zeros
    const originalInput = input.toString();

if (template === 'incremental') {
  let currentInput = originalInput;

  // Handle potential E-notation in originalInput
  if (this.isENotation(currentInput)) {
    const numVal = Number(originalInput);
    // If the number is 0 but original string starts with "0.0" (e.g., "0.0e0"), preserve "0.0" part.
    if (numVal === 0 && originalInput.toLowerCase().startsWith('0.0')) {
        const parts = originalInput.toLowerCase().split('e');
        currentInput = parts[0]; // This preserves "0.0" from "0.0e..."
    } else {
        currentInput = this.convertENotationToRegularNumber(numVal);
    }
  }

  let sign = '';
  if (currentInput.startsWith('-')) {
    sign = '-';
    currentInput = currentInput.substring(1); // currentInput is now the absolute numeric string
  }

  const currentThousandSeparator = thousandSeparator || ',';
  const currentDecimalSeparator = decimalSeparator || '.';

  if (currentInput === '') {
    return {
      value: '',
      prefix: '',
      postfix: '',
      sign: '', // Sign is empty for empty input
      wholeNumber: ''
    } as FormattedObject;
  }

  // Handles "0" (from input "0" or "-0")
  if (currentInput === '0') {
    return {
      value: '0', // "-0" becomes "0"
      prefix: '',
      postfix: '',
      sign: '', // Sign is empty for "0"
      wholeNumber: '0',
    } as FormattedObject;
  }

  // Handle cases like "." or "0." or ".0"
  // If input is just the decimal separator, treat as "0" + separator
  if (currentInput === currentDecimalSeparator) {
    currentInput = '0' + currentDecimalSeparator;
  }

  let integerPart = currentInput;
  let decimalPart = '';
  // Check for decimal separator after potential modification of currentInput (e.g. "." -> "0.")
  let hasDecimalPoint = currentInput.includes(currentDecimalSeparator);

  if (hasDecimalPoint) {
    const parts = currentInput.split(currentDecimalSeparator);
    integerPart = parts[0];
    decimalPart = parts.length > 1 ? parts[1] : '';
  }

  // Remove all leading zeros from integer part first
  if (integerPart.length > 0) {
      integerPart = integerPart.replace(/^0+/, '');
  }

  // If integerPart became empty (e.g. "00" -> "" or original was like ".5")
  // set it to "0". This ensures "0.5" (from ".5" or "0.5") and "0" (from "00").
  if (integerPart === '') {
    integerPart = '0';
  }

  const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, currentThousandSeparator);

  let finalValue = formattedIntegerPart;
  if (hasDecimalPoint) {
    finalValue += currentDecimalSeparator + decimalPart;
  }

  const finalNumericValue = finalValue; // finalValue at this point is the formatted absolute number
  let resultSign = '';
  let resultValue = finalNumericValue;

  if (sign === '-') {
    // Only add sign if the number isn't representing plain zero.
    // parseFloat "0.00" is 0. "0" is 0.
    // We want "-0.123", but "0" for "-0".
    // We want "-0.00" for input "-0.00" (if that's a required display for zero value with decimals)
    // The tests for "-0.000000123" expect "-0.000000123".
    // The tests for 0.000000123 expect "0.000000123".
    // Test for -0 will clarify if it should be "0" or "-0". Assume "0".

    if (parseFloat(finalNumericValue) === 0 && !finalNumericValue.includes('.')) { // handles "0"
        resultSign = ''; // Make "-0" become "0"
        // resultValue is already "0"
    } else {
        resultSign = '-';
        resultValue = sign + finalNumericValue;
    }
  }

  return {
    value: resultValue,
    prefix: '',
    postfix: '',
    sign: resultSign,
    wholeNumber: resultValue, // wholeNumber includes sign now
  } as FormattedObject;
}

    if (!template?.match(/^(number|usd|irt|irr|percent|incremental)$/g))
      template = 'number';
    
    if (this.isENotation(originalInput)) {
      input = this.convertENotationToRegularNumber(Number(input));
    }

    // Replace each Persian/Arabic numeral in the string with its English counterpart and strip all non-numeric chars
    let numberString = input
      .toString()
      .replace(/[\u0660-\u0669\u06F0-\u06F9]/g, function (match: string) {
        return String(match.charCodeAt(0) & 0xf);
      })
      .replace(/[^\d.-]/g, '');

    // Stripping leading zeros only, preserve trailing zeros
    numberString = numberString
      .replace(/^0+(?=\d)/g, '');

    const number = Math.abs(Number(numberString));
    let p, d, r, c;
    let f = 0;

    // Auto precision selection
    if (precision === 'auto') {
      if (template.match(/^(usd|irt|irr|number)$/g)) {
        if (number >= 0.0001 && number < 100_000_000_000) {
          precision = 'high';
        } else {
          precision = 'medium';
        }
      } else if (template === 'percent') {
        precision = 'low';
      }
    }

    if (precision === 'medium') {
      if (number >= 0 && number < 0.0001) {
        p = 33;
        d = 4;
        r = false;
        c = true;
      } else if (number >= 0.0001 && number < 0.001) {
        p = 7;
        d = 4;
        r = false;
        c = false;
      } else if (number >= 0.001 && number < 0.01) {
        p = 5;
        d = 3;
        r = false;
        c = false;
      } else if (number >= 0.001 && number < 0.1) {
        p = 3;
        d = 2;
        r = false;
        c = false;
      } else if (number >= 0.1 && number < 1) {
        p = 1;
        d = 1;
        r = false;
        c = false;
      } else if (number >= 1 && number < 10) {
        p = 3;
        d = 3;
        r = false;
        c = false;
      } else if (number >= 10 && number < 100) {
        p = 2;
        d = 2;
        r = false;
        c = false;
      } else if (number >= 100 && number < 1000) {
        p = 1;
        d = 1;
        r = false;
        c = false;
      } else if (number >= 1000) {
        const x = Math.floor(Math.log10(number)) % 3;
        p = 2 - x;
        d = 2 - x;
        r = true;
        c = true;
      } else {
        p = 0;
        d = 0;
        r = true;
        c = true;
      }
    } else if (precision === 'low') {
      if (number >= 0 && number < 0.01) {
        p = 2;
        d = 0;
        r = true;
        c = false;
        f = 2;
      } else if (number >= 0.01 && number < 0.1) {
        p = 2;
        d = 1;
        r = true;
        c = false;
      } else if (number >= 0.1 && number < 1) {
        p = 2;
        d = 2;
        r = true;
        c = false;
      } else if (number >= 1 && number < 10) {
        p = 2;
        d = 2;
        r = true;
        c = false;
        f = 2;
      } else if (number >= 10 && number < 100) {
        p = 1;
        d = 1;
        r = true;
        c = false;
        f = 1;
      } else if (number >= 100 && number < 1000) {
        p = 0;
        d = 0;
        r = true;
        c = false;
      } else if (number >= 1000) {
        const x = Math.floor(Math.log10(number)) % 3;
        p = 1 - x;
        d = 1 - x;
        r = true;
        c = true;
      } else {
        p = 0;
        d = 0;
        r = true;
        c = true;
        f = 2;
      }
    } else {
      // precision === "high"
      if (number >= 0 && number < 1) {
        p = 33;
        d = 4;
        r = false;
        c = false;
      } else if (number >= 1 && number < 10) {
        p = 3;
        d = 3;
        r = true;
        c = false;
      } else if (number >= 10 && number < 100) {
        p = 2;
        d = 2;
        r = true;
        c = false;
      } else if (number >= 100 && number < 1000) {
        p = 2;
        d = 2;
        r = true;
        c = false;
      } else if (number >= 1000 && number < 10000) {
        p = 1;
        d = 1;
        r = true;
        c = false;
      } else {
        p = 0;
        d = 0;
        r = true;
        c = false;
      }
    }

    // For scientific notation, increase precision to ensure correct representation
    if (this.isENotation(originalInput)) {
      p = Math.max(p, 20);
      r = false;
    }
    
    return this.reducePrecision(
      numberString,
      p,
      d,
      r,
      c,
      f,
      template,
      language,
      outputFormat,
      prefixMarker,
      postfixMarker,
      prefix,
      postfix,
      thousandSeparator,
      decimalSeparator,
      originalInput
    );
  }
  
  private convertENotationToRegularNumber(num: number): string {
    let numStr = String(num);

    // If not E-notation according to JS default toString, return it.
    if (numStr.toLowerCase().indexOf('e') === -1) {
      return numStr;
    }

    // If it IS E-notation, attempt to convert to plain decimal string.
    // Handle very small numbers (negative exponent) using toFixed.
    // Check num !== 0 because String(0) is "0", which doesn't contain 'e'.
    if (Math.abs(num) < 1.0 && num !== 0) {
      const eParts = numStr.toLowerCase().split('e');
      // Ensure it's a valid E-notation string with a negative exponent
      if (eParts.length === 2) {
        const exponent = parseInt(eParts[1], 10);
        if (exponent < 0) {
          let precision = Math.abs(exponent);
          if (eParts[0].includes('.')) {
            precision += eParts[0].split('.')[1].length;
          }
          // Cap precision to prevent overly long strings or errors with toFixed.
          return num.toFixed(Math.min(precision, 100));
        }
      }
    }

    // Handle large numbers or numbers with positive E-notation if not caught above.
    // This part manually reconstructs the string.
    const parts = numStr.toLowerCase().split('e');
    if (parts.length === 2) {
        const coefficientStr = parts[0];
        const exponent = parseInt(parts[1], 10);

        let [integer, fraction] = coefficientStr.split('.');
        fraction = fraction || '';

        if (exponent > 0) { // Positive exponent
            // Remove sign from integer for length calculations if present
            const sign = integer.startsWith('-') ? "-" : "";
            if (sign) integer = integer.substring(1);

            if (fraction.length <= exponent) {
                return sign + integer + fraction.padEnd(exponent, '0');
            } else {
                return sign + integer + fraction.substring(0, exponent) + '.' + fraction.substring(exponent);
            }
        } else if (exponent < 0) {
            // This path is a fallback for negative exponents if the toFixed method above wasn't triggered
            // (e.g., if Math.abs(num) >= 1.0 but it's something like 1.0e-5, though Number(1.0e-5) is < 1.0)
            // The toFixed approach is generally more robust for negative exponents.
            // For simplicity, we'll rely on the prior toFixed for most negative exponent cases.
            // If it reaches here, it implies an unusual case or that toFixed didn't resolve it.
            // Return the result from toFixed from the earlier block if possible, or the original numStr if it's complex.
            // As a basic fallback if toFixed didn't run (e.g. num was 0, but that doesn't produce 'e'):
             let precision = Math.abs(exponent);
             if (coefficientStr.includes('.')) {
                 precision += coefficientStr.split('.')[1].length;
             }
             return num.toFixed(Math.min(precision, 100)); // Try toFixed again as a general solution
        } else { // exponent === 0
            return coefficientStr; // e.g., 1.23e0 is 1.23
        }
    }

    // Fallback if parsing E-notation parts failed, return original stringified number.
    // Or if it was an E-notation not handled by above (e.g. unusual format or extreme exponent)
    return numStr;
  }

  private reducePrecision(
    numberString: string,
    precision = 30,
    nonZeroDigits = 4,
    round = false,
    compress = false,
    fixedDecimalZeros = 0,
    template = 'number',
    language = 'en',
    outputFormat = 'plain',
    prefixMarker = 'span',
    postfixMarker = 'span',
    prefix = '',
    postfix = '',
    thousandSeparator = ',',
    decimalSeparator = '.',
    originalInput = ''
  ) {
    if (numberString === undefined || numberString === null || numberString.trim() === '') {
      return {} as FormattedObject;
    }

    // Handle negative zero
    if (numberString === '-0' || numberString === '-0.0') {
      numberString = numberString.substring(1); // Remove negative sign for zero
    }

    numberString = numberString.toString();

    const maxPrecision = 30;
    const maxIntegerDigits = 21;
    const scaleUnits = template.match(/^(number|percent)$/g)
      ? {
          '': '',
          K: ' هزار',
          M: ' میلیون',
          B: ' میلیارد',
          T: ' تریلیون',
          Qd: ' کادریلیون',
          Qt: ' کنتیلیون',
        }
      : {
          '': '',
          K: ' هزار ت',
          M: ' میلیون ت',
          B: ' میلیارد ت',
          T: ' همت',
          Qd: ' هزار همت',
          Qt: ' میلیون همت',
        };

    const fullScaleUnits = template.match(/^(number|percent)$/g)
      ? {
          '': '',
          K: ' هزار',
          M: ' میلیون',
          B: ' میلیارد',
          T: ' تریلیون',
          Qd: ' کادریلیون',
          Qt: ' کنتیلیون',
        }
      : {
          '': '',
          K: ' هزار تومان',
          M: ' میلیون تومان',
          B: ' میلیارد تومان',
          T: ' هزار میلیارد تومان',
          Qd: ' کادریلیون تومان',
          Qt: ' کنتیلیون تومان',
        };

    let parts = /^(-)?(\d+)\.?([0]*)(\d*)$/g.exec(numberString);

    if (!parts) {
      return {} as FormattedObject;
    }

    const sign = parts[1] || '';
    let nonFractionalStr = parts[2];
    let fractionalZeroStr = parts[3];
    let fractionalNonZeroStr = parts[4];
    let unitPrefix = '';
    let unitPostfix = '';

    if (fractionalZeroStr.length >= maxPrecision) {
      // Number is smaller than maximum precision
      fractionalZeroStr = '0'.padEnd(maxPrecision - 1, '0');
      fractionalNonZeroStr = '1';
    } else if (fractionalZeroStr.length + nonZeroDigits > precision) {
      // decrease non-zero digits
      nonZeroDigits = precision - fractionalZeroStr.length;
      if (nonZeroDigits < 1) nonZeroDigits = 1;
    } else if (nonFractionalStr.length > maxIntegerDigits) {
      nonFractionalStr = '0';
      fractionalZeroStr = '';
      fractionalNonZeroStr = '';
    }

    // compress large numbers
    if (compress && nonFractionalStr.length >= 4) {
      const scaleUnitKeys = Object.keys(scaleUnits);
      let scaledWholeNumber = nonFractionalStr;
      let unitIndex = 0;
      while (+scaledWholeNumber > 999 && unitIndex < scaleUnitKeys.length - 1) {
        scaledWholeNumber = (+scaledWholeNumber / 1000).toFixed(2);
        unitIndex++;
      }
      unitPostfix = scaleUnitKeys[unitIndex];
      parts = /^(-)?(\d+)\.?([0]*)(\d*)$/g.exec(scaledWholeNumber.toString());

      if (!parts) {
        return {} as FormattedObject;
      }

      // sign = parts[1] || "";
      nonFractionalStr = parts[2];
      fractionalZeroStr = parts[3];
      fractionalNonZeroStr = parts[4];
    }

    // Truncate the fractional part or round it
    // if (precision > 0 && nonZeroDigits > 0 && fractionalNonZeroStr.length > nonZeroDigits) {
    if (fractionalNonZeroStr.length > nonZeroDigits) {
      if (!round) {
        fractionalNonZeroStr = fractionalNonZeroStr.substring(0, nonZeroDigits);
      } else {
        if (parseInt(fractionalNonZeroStr[nonZeroDigits]) < 5) {
          fractionalNonZeroStr = fractionalNonZeroStr.substring(
            0,
            nonZeroDigits
          );
        } else {
          fractionalNonZeroStr = (
            parseInt(fractionalNonZeroStr.substring(0, nonZeroDigits)) + 1
          ).toString();
          // If overflow occurs (e.g., 999 + 1 = 1000), adjust the substring length
          if (fractionalNonZeroStr.length > nonZeroDigits) {
            if (fractionalZeroStr.length > 0) {
              fractionalZeroStr = fractionalZeroStr.substring(
                0,
                fractionalZeroStr.length - 1
              );
            } else {
              nonFractionalStr = (Number(nonFractionalStr) + 1).toString();
              fractionalNonZeroStr = fractionalNonZeroStr.substring(1);
            }
          }
        }
      }
    }

    // Using dex style
    if (compress && fractionalZeroStr !== '' && unitPostfix === '') {
      fractionalZeroStr =
        '0' +
        fractionalZeroStr.length.toString().replace(/\d/g, function (match) {
          return [
            '₀',
            '₁',
            '₂',
            '₃',
            '₄',
            '₅',
            '₆',
            '₇',
            '₈',
            '₉',
          ][parseInt(match, 10)];
        });
    }

    // Check if the original input had trailing zeros
    let fractionalPartStr = `${fractionalZeroStr}${fractionalNonZeroStr}`;
    // Don't truncate trailing zeros when they're in the original string
    if (fractionalPartStr.length > precision && !originalInput.includes('e')) {
      fractionalPartStr = fractionalPartStr.substring(0, precision);
    }
    
    // For scientific notation and numbers with trailing zeros, preserve the format
    if (originalInput.includes('e') || originalInput.includes('E')) {
      // For scientific notation, use the converted string
    } else if (originalInput.includes('.')) {
      // For regular numbers with decimal point, check for trailing zeros
      const originalParts = originalInput.split('.');
      if (originalParts.length === 2) {
        const originalDecimal = originalParts[1];
        // If original has more digits than what we have now, preserve those trailing zeros
        if (originalDecimal.length > fractionalPartStr.length && originalDecimal.endsWith('0')) {
          // Count trailing zeros in original
          let trailingZeros = 0;
          for (let i = originalDecimal.length - 1; i >= 0; i--) {
            if (originalDecimal[i] === '0') {
              trailingZeros++;
            } else {
              break;
            }
          }
          // Add back trailing zeros if they were in the original
          if (trailingZeros > 0) {
            fractionalPartStr = fractionalPartStr.padEnd(fractionalPartStr.length + trailingZeros, '0');
          }
        }
      }
    }

    // Output Formating, Prefix, Postfix
    if (template === 'usd') {
      unitPrefix = language === 'en' ? '$' : '';
      if (!unitPostfix) unitPostfix = language === 'fa' ? ' دلار' : '';
    } else if (template === 'irr') {
      if (!unitPostfix) unitPostfix = language === 'fa' ? ' ر' : ' R';
    } else if (template === 'irt') {
      if (!unitPostfix) unitPostfix = language === 'fa' ? ' ت' : ' T';
    } else if (template === 'percent') {
      if (language === 'en') {
        unitPostfix += '%';
      } else {
        unitPostfix += !unitPostfix ? '٪' : ' درصد';
      }
    }
    unitPrefix = prefix + unitPrefix;
    unitPostfix += postfix;
    if (outputFormat === 'html') {
      if (unitPrefix)
        unitPrefix = `<${prefixMarker}>${unitPrefix}</${prefixMarker}>`;
      if (unitPostfix)
        unitPostfix = `<${postfixMarker}>${unitPostfix}</${postfixMarker}>`;
    } else if (outputFormat === 'markdown') {
      if (unitPrefix)
        unitPrefix = `${prefixMarker}${unitPrefix}${prefixMarker}`;
      if (unitPostfix)
        unitPostfix = `${postfixMarker}${unitPostfix}${postfixMarker}`;
    }

    const thousandSeparatorRegex = /\B(?=(\d{3})+(?!\d))/g;
    const fixedDecimalZeroStr = fixedDecimalZeros
      ? '.'.padEnd(fixedDecimalZeros + 1, '0')
      : '';
    let out = '';
    let wholeNumberStr;
    
    // FIXED: Changed condition to correctly handle numbers with trailing zeros
    // Old condition: if (precision <= 0 || nonZeroDigits <= 0 || !fractionalNonZeroStr) {
    // New condition checks if both fractional parts are empty
    if (precision <= 0 || nonZeroDigits <= 0 || (fractionalNonZeroStr === '' && fractionalZeroStr === '')) {
      wholeNumberStr = `${nonFractionalStr.replace(
        thousandSeparatorRegex,
        ','
      )}${fixedDecimalZeroStr}`;
    } else {
      wholeNumberStr = `${nonFractionalStr.replace(
        thousandSeparatorRegex,
        ','
      )}.${fractionalPartStr}`;
    }

    out = `${sign}${unitPrefix}${wholeNumberStr}${unitPostfix}`;

    const formattedObject: FormattedObject = {
      value: out,
      prefix: unitPrefix,
      postfix: unitPostfix,
      sign: sign,
      wholeNumber: wholeNumberStr,
    };

    // replace custom config
    formattedObject.value = (formattedObject?.value ?? '')
      .replace(/,/g, thousandSeparator)
      .replace(/\./g, decimalSeparator);

    // Convert output to Persian numerals if language is "fa"
    if (language === 'fa') {
      formattedObject.value = (formattedObject?.value ?? '')
        .replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 1728))
        .replace(/(K|M|B|T|Qt|Qd)/g, function (c: string) {
          return String(scaleUnits[c as keyof typeof scaleUnits]);
        });

      formattedObject.fullPostfix = unitPostfix
        .replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 1728))
        .replace(/(K|M|B|T|Qt|Qd)/g, function (c: string) {
          return String(fullScaleUnits[c as keyof typeof fullScaleUnits]);
        });

      formattedObject.postfix = formattedObject.postfix
        .replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 1728))
        .replace(/(K|M|B|T|Qt|Qd)/g, function (c: string) {
          return String(scaleUnits[c as keyof typeof scaleUnits]);
        });

      formattedObject.wholeNumber = formattedObject.wholeNumber
        .replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 1728))
        .replace(/(K|M|B|T|Qt|Qd)/g, function (c: string) {
          return String(scaleUnits[c as keyof typeof scaleUnits]);
        });
    }

    return formattedObject;
  }
}

export default NumberFormatter;