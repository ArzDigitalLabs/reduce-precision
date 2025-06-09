type Template = 'number' | 'usd' | 'irt' | 'irr' | 'percent';
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
      thousandSeparator: '٫',
      decimalSeparator: '٬',
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
    // Start with default options (which includes 'en' specific settings)
    let newOptions = { ...this.options };

    // If a language is specified in the incoming options,
    // apply the defaults for that language first.
    if (options.language) {
      const langDefaults = this.defaultLanguageConfig[options.language];
      if (langDefaults) {
        newOptions = { ...newOptions, ...langDefaults, language: options.language };
      }
    }

    // Then, apply all incoming options, allowing them to override.
    // This ensures options.precision, options.decimalSeparator (if any), etc., take precedence.
    newOptions = { ...newOptions, ...options };

    this.options = newOptions;
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
    
    if (!template?.match(/^(number|usd|irt|irr|percent)$/g))
      template = 'number';

    // Store original input string to preserve format for trailing zeros
    const originalInput = input.toString();
    
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
        p = 4;
        d = 2;
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
  
  private convertENotationToRegularNumber(eNotation: number): string {
    // For simple cases like 1e3, directly use Number constructor
    if (Number.isInteger(eNotation) && eNotation >= 1000) {
      return eNotation.toString();
    }
    
    const parts = eNotation.toString().toLowerCase().split('e');
    if (parts.length !== 2) return eNotation.toString();
    
    const coefficient = parseFloat(parts[0]);
    const exponent = parseInt(parts[1], 10);
    
    // Handle negative exponents (very small numbers)
    if (exponent < 0) {
      const absExponent = Math.abs(exponent);
      // Determine precision needed to show all digits
      const precision = absExponent + 
        (parts[0].includes('.') ? parts[0].split('.')[1].length : 0);
      return eNotation.toFixed(precision);
    }
    
    // For positive exponents, let JavaScript do the conversion
    return eNotation.toString();
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

    let parts = /^(-)?(\d*)\.?([0]*)(\d*)$/g.exec(numberString);

    if (!parts) {
      return {} as FormattedObject;
    }

    const sign = parts[1] || '';
    let nonFractionalStr = parts[2];
    nonFractionalStr = nonFractionalStr || '0';
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

    let fractionalPartStr = `${fractionalZeroStr}${fractionalNonZeroStr}`;

    // Preserve fractional part from originalInput if it contains a decimal separator
    if (originalInput.includes('.')) {
      const originalDecimalPart = originalInput.split('.')[1] || '';
      fractionalPartStr = originalDecimalPart;
    } else {
      // Apply fixedDecimalZeros only if originalInput doesn't have a decimal separator
      if (fixedDecimalZeros > 0 && fractionalPartStr.length === 0) {
        fractionalPartStr = ''.padEnd(fixedDecimalZeros, '0');
      } else if (fractionalPartStr.length > precision && !originalInput.includes('e')) {
        // original logic for truncation when not guided by originalInput's decimal
        fractionalPartStr = fractionalPartStr.substring(0, precision);
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
    let out = '';
    let wholeNumberStr;

    const formattedNonFractionalStr = nonFractionalStr.replace(thousandSeparatorRegex, thousandSeparator);

    if (originalInput.includes('.')) {
      const endsWithDecimal = originalInput.endsWith('.');
      if (fractionalPartStr === '' && !endsWithDecimal) {
        // Input like "123" (no decimal in original, but somehow fractionalPartStr is empty now)
        // or input like "123.0" and fractionalPartStr became ""
        // We should not add a decimal point if original didn't imply it or fractional part is truly zero.
        wholeNumberStr = formattedNonFractionalStr;
        // if fixedDecimalZeros is set and originalInput didn't have a decimal, it's handled above
      } else {
        // Handles "123.45", "123.", ".45"
        // If endsWithDecimal is true (e.g. "123."), fractionalPartStr might be "" but we still want the separator.
        wholeNumberStr = `${formattedNonFractionalStr}${decimalSeparator}${fractionalPartStr}`;
      }
    } else {
      // originalInput does not contain "."
      if (fractionalPartStr.length > 0) {
        wholeNumberStr = `${formattedNonFractionalStr}${decimalSeparator}${fractionalPartStr}`;
      } else if (fixedDecimalZeros > 0) {
        // This case is now handled by fractionalPartStr padding logic if originalInput has no decimal
        wholeNumberStr = `${formattedNonFractionalStr}${decimalSeparator}${ ''.padEnd(fixedDecimalZeros, '0')}`;
      }
      else {
        wholeNumberStr = formattedNonFractionalStr;
      }
    }

    out = `${sign}${unitPrefix}${wholeNumberStr}${unitPostfix}`;

    const formattedObject: FormattedObject = {
      value: out,
      prefix: unitPrefix,
      postfix: unitPostfix,
      sign: sign,
      wholeNumber: wholeNumberStr,
    };

    // replace custom config --千分位和自定义小数分隔符已经提前处理
    // formattedObject.value = (formattedObject?.value ?? '')
    //   .replace(/,/g, thousandSeparator) // Thousand separators are applied in wholeNumberStr construction
    //   .replace(/\./g, decimalSeparator); // Decimal separator is applied in wholeNumberStr construction

    // Ensure the final value uses the correct decimal separator if not already applied
    // This is more of a safeguard, as logic above should handle it.
    if (language === 'fa' && decimalSeparator === '٬') {
       // For FA, ensure dot is replaced if it somehow slipped through, though wholeNumberStr should use decimalSeparator
       formattedObject.value = (formattedObject.value ?? '').replace(/\./g, decimalSeparator);
    } else if (decimalSeparator !== '.') {
       // For any custom decimal separator other than '.', ensure it's correctly applied.
       // This mainly catches cases where default '.' might have been used if logic branches were missed.
       // The construction of wholeNumberStr should ideally prevent this.
       formattedObject.value = (formattedObject.value ?? '').replace(/\./g, decimalSeparator);
    }
    // Thousand separators are already applied to nonFractionalStr before this point.

    // Convert output to Persian numerals if language is "fa"
    // Also, ensure that the decimalSeparator for 'fa' is correctly used if it was temporarily a '.'
    if (language === 'fa') {
      let val = formattedObject.value ?? '';
      // If English decimal separator was used due to direct originalInput copy, replace it.
      if (decimalSeparator === '٬') { //Specific for fa
        val = val.replace(/\./g, decimalSeparator);
      }
      val = val.replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 1728))
        .replace(/(K|M|B|T|Qt|Qd)/g, function (c: string) {
          return String(scaleUnits[c as keyof typeof scaleUnits]);
        });
      formattedObject.value = val;

      // Apply to other parts as well
      let faWholeNumber = formattedObject.wholeNumber;
      if (decimalSeparator === '٬') {
        faWholeNumber = faWholeNumber.replace(/\./g, decimalSeparator);
      }
      formattedObject.wholeNumber = faWholeNumber
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
    } else {
      // Ensure correct decimal separator for non-'fa' languages if it's not '.'
      if (decimalSeparator !== '.') {
        formattedObject.value = (formattedObject.value ?? '').replace(/\./g, decimalSeparator);
        formattedObject.wholeNumber = formattedObject.wholeNumber.replace(/\./g, decimalSeparator);
      }
    }


    return formattedObject;
  }
}

export default NumberFormatter;