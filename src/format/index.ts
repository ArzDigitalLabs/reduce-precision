type Template = 'number' | 'usd' | 'irt' | 'irr' | 'percent';
type Precision = 'auto' | 'high' | 'medium' | 'low';
type Language = 'en' | 'fa';
type OutputFormat = 'plain' | 'html' | 'markdown';

interface Options {
  precision?: Precision;
  template?: Template;
  language?: Language;
  outputFormat?: OutputFormat;
  prefixMarker?: string;
  postfixMarker?: string;
  prefix?: string;
  postfix?: string;
}

function format(
  input: string | number,
  options: Options = {
    precision: 'high',
    template: 'number',
    language: 'en',
    outputFormat: 'plain',
    prefixMarker: 'i',
    postfixMarker: 'i',
    prefix: '',
    postfix: '',
  }
): string | number {
  let { precision, template } = options;

  const {
    language,
    outputFormat,
    prefixMarker,
    postfixMarker,
    prefix,
    postfix,
  } = options;

  if (!input) return 0;

  if (!template?.match(/^(number|usd|irt|irr|percent)$/g)) template = 'number';

  // Replace each Persian/Arabic numeral in the string with its English counterpart and strip all non-numeric chars
  let numberString = input
    .toString()
    .replace(/[\u0660-\u0669\u06F0-\u06F9]/g, function (match: string) {
      return String(match.charCodeAt(0) & 0xf);
    })
    .replace(/[^\d.-]/g, '');

  // Stripping leading zeros and trailing zeros after a decimal point
  numberString = numberString
    .replace(/^0+(?=\d)/g, '')
    .replace(/(?<=\.\d*)0+$|(?<=\.\d)0+\b/g, '');

  const number = Math.abs(Number(numberString));
  let p, d, r, c;
  let f = 0;

  // Auto precision selection
  if (precision === 'auto') {
    if (template.match(/^(usd|irt|irr)$/g)) {
      if (number >= 0.0001 && number < 100_000_000_000) {
        precision = 'high';
      } else {
        precision = 'medium';
      }
    } else if (template === 'number') {
      precision = 'medium';
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

  return reducePrecision(
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
    postfix
  );
}

function reducePrecision(
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
  postfix = ''
) {
  if (!numberString) return 0;
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

  let parts = /^(-)?(\d+)\.?([0]*)(\d*)$/g.exec(numberString);

  if (!parts) {
    return 0;
  }

  const sign = parts[1] || '';
  let wholeNumberStr = parts[2];
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
  } else if (wholeNumberStr.length > maxIntegerDigits) {
    wholeNumberStr = '0';
    fractionalZeroStr = '';
    fractionalNonZeroStr = '';
  }

  // compress large numbers
  if (compress && wholeNumberStr.length >= 4) {
    const scaleUnitKeys = Object.keys(scaleUnits);
    let scaledWholeNumber = wholeNumberStr;
    let unitIndex = 0;
    while (+scaledWholeNumber > 999 && unitIndex < scaleUnitKeys.length - 1) {
      scaledWholeNumber = (+scaledWholeNumber / 1000).toFixed(2);
      unitIndex++;
    }
    unitPostfix = scaleUnitKeys[unitIndex];
    parts = /^(-)?(\d+)\.?([0]*)(\d*)$/g.exec(scaledWholeNumber.toString());

    if (!parts) {
      return 0;
    }

    // sign = parts[1] || "";
    wholeNumberStr = parts[2];
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
        fractionalNonZeroStr = fractionalNonZeroStr.substring(0, nonZeroDigits);
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
            wholeNumberStr = (Number(wholeNumberStr) + 1).toString();
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
  fractionalPartStr = fractionalPartStr.substring(0, precision);
  fractionalPartStr = fractionalPartStr.replace(/^(\d*[1-9])0+$/g, '$1');

  // Output Formating, Prefix, Postfix
  if (template === 'usd') {
    unitPrefix = language === 'en' ? '$' : '';
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
    if (unitPrefix) unitPrefix = `${prefixMarker}${unitPrefix}${prefixMarker}`;
    if (unitPostfix)
      unitPostfix = `${postfixMarker}${unitPostfix}${postfixMarker}`;
  }

  const thousandSeparatorRegex = /\B(?=(\d{3})+(?!\d))/g;
  const fixedDecimalZeroStr = fixedDecimalZeros
    ? '.'.padEnd(fixedDecimalZeros + 1, '0')
    : '';
  let out = '';
  if (precision <= 0 || nonZeroDigits <= 0 || !fractionalNonZeroStr) {
    out = `${sign}${unitPrefix}${wholeNumberStr.replace(
      thousandSeparatorRegex,
      ','
    )}${fixedDecimalZeroStr}${unitPostfix}`;
  } else {
    out = `${sign}${unitPrefix}${wholeNumberStr.replace(
      thousandSeparatorRegex,
      ','
    )}.${fractionalPartStr}${unitPostfix}`;
  }

  // Convert output to Persian numerals if language is "fa"
  if (language === 'fa') {
    out = out
      .replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 1728))
      .replace(/,/g, '٬')
      .replace(/\./g, '٫')
      .replace(/(K|M|B|T|Qt|Qd)/g, function (c: string) {
        return String(scaleUnits[c as keyof typeof scaleUnits]);
      });
  }

  return out;
}

export default format;
