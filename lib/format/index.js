"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NumberFormatter {
    constructor(options = {}) {
        this.languageBaseConfig = {
            prefixMarker: 'i',
            postfixMarker: 'i',
            prefix: '',
            postfix: '',
        };
        this.defaultLanguageConfig = {
            en: Object.assign(Object.assign({}, this.languageBaseConfig), { thousandSeparator: ',', decimalSeparator: '.' }),
            fa: Object.assign(Object.assign({}, this.languageBaseConfig), { thousandSeparator: '٫', decimalSeparator: '٬' }),
        };
        this.options = Object.assign({ language: 'en', template: 'number', precision: 'high', outputFormat: 'plain' }, this.defaultLanguageConfig['en']);
        this.options = Object.assign(Object.assign({}, this.options), options);
    }
    setLanguage(lang, config = {}) {
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
    setTemplate(template, precision) {
        this.options.template = template;
        this.options.precision = precision;
        return this;
    }
    toJson(input) {
        const formattedObject = this.format(input);
        delete formattedObject.value;
        return formattedObject;
    }
    toString(input) {
        const formattedObject = this.format(input);
        return formattedObject.value || '';
    }
    toPlainString(input) {
        this.options.outputFormat = 'plain';
        const formattedObject = this.format(input);
        return formattedObject.value || '';
    }
    toHtmlString(input) {
        this.options.outputFormat = 'html';
        const formattedObject = this.format(input);
        return formattedObject.value || '';
    }
    toMdString(input) {
        this.options.outputFormat = 'markdown';
        const formattedObject = this.format(input);
        return formattedObject.value || '';
    }
    // Private methods...
    isENotation(input) {
        return /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)$/.test(input);
    }
    format(input) {
        let { precision, template } = this.options;
        const { language, outputFormat, prefixMarker, postfixMarker, prefix, postfix, thousandSeparator, decimalSeparator, } = this.options;
        if (!input)
            return {};
        if (!(template === null || template === void 0 ? void 0 : template.match(/^(number|usd|irt|irr|percent)$/g)))
            template = 'number';
        
        // Store original input string to preserve format for trailing zeros
        const originalInput = input.toString();
        
        if (this.isENotation(originalInput)) {
            input = this.convertENotationToRegularNumber(Number(input));
        }
        
        // Replace each Persian/Arabic numeral in the string with its English counterpart and strip all non-numeric chars
        let numberString = input
            .toString()
            .replace(/[\u0660-\u0669\u06F0-\u06F9]/g, function (match) {
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
                if (number >= 0.0001 && number < 100000000000) {
                    precision = 'high';
                }
                else {
                    precision = 'medium';
                }
            }
            else if (template === 'percent') {
                precision = 'low';
            }
        }
        
        if (precision === 'medium') {
            if (number >= 0 && number < 0.0001) {
                p = 33;
                d = 4;
                r = false;
                c = true;
            }
            else if (number >= 0.0001 && number < 0.001) {
                p = 7;
                d = 4;
                r = false;
                c = false;
            }
            else if (number >= 0.001 && number < 0.01) {
                p = 5;
                d = 3;
                r = false;
                c = false;
            }
            else if (number >= 0.001 && number < 0.1) {
                p = 3;
                d = 2;
                r = false;
                c = false;
            }
            else if (number >= 0.1 && number < 1) {
                p = 1;
                d = 1;
                r = false;
                c = false;
            }
            else if (number >= 1 && number < 10) {
                p = 3;
                d = 3;
                r = false;
                c = false;
            }
            else if (number >= 10 && number < 100) {
                p = 2;
                d = 2;
                r = false;
                c = false;
            }
            else if (number >= 100 && number < 1000) {
                p = 1;
                d = 1;
                r = false;
                c = false;
            }
            else if (number >= 1000) {
                const x = Math.floor(Math.log10(number)) % 3;
                p = 2 - x;
                d = 2 - x;
                r = true;
                c = true;
            }
            else {
                p = 0;
                d = 0;
                r = true;
                c = true;
            }
        }
        else if (precision === 'low') {
            if (number >= 0 && number < 0.01) {
                p = 2;
                d = 0;
                r = true;
                c = false;
                f = 2;
            }
            else if (number >= 0.01 && number < 0.1) {
                p = 2;
                d = 1;
                r = true;
                c = false;
            }
            else if (number >= 0.1 && number < 1) {
                p = 2;
                d = 2;
                r = true;
                c = false;
            }
            else if (number >= 1 && number < 10) {
                p = 2;
                d = 2;
                r = true;
                c = false;
                f = 2;
            }
            else if (number >= 10 && number < 100) {
                p = 1;
                d = 1;
                r = true;
                c = false;
                f = 1;
            }
            else if (number >= 100 && number < 1000) {
                p = 0;
                d = 0;
                r = true;
                c = false;
            }
            else if (number >= 1000) {
                const x = Math.floor(Math.log10(number)) % 3;
                p = 1 - x;
                d = 1 - x;
                r = true;
                c = true;
            }
            else {
                p = 0;
                d = 0;
                r = true;
                c = true;
                f = 2;
            }
        }
        else {
            // precision === "high"
            if (number >= 0 && number < 1) {
                p = 33;
                d = 4;
                r = false;
                c = false;
            }
            else if (number >= 1 && number < 10) {
                p = 3;
                d = 3;
                r = true;
                c = false;
            }
            else if (number >= 10 && number < 100) {
                p = 2;
                d = 2;
                r = true;
                c = false;
            }
            else if (number >= 100 && number < 1000) {
                p = 2;
                d = 2;
                r = true;
                c = false;
            }
            else if (number >= 1000 && number < 10000) {
                p = 1;
                d = 1;
                r = true;
                c = false;
            }
            else {
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
    
    convertENotationToRegularNumber(eNotation) {
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
    
    reducePrecision(
        numberString, 
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
        var _a, _b;
        
        if (!numberString) {
            return {};
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
            return {};
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
        }
        else if (fractionalZeroStr.length + nonZeroDigits > precision) {
            // decrease non-zero digits
            nonZeroDigits = precision - fractionalZeroStr.length;
            if (nonZeroDigits < 1)
                nonZeroDigits = 1;
        }
        else if (nonFractionalStr.length > maxIntegerDigits) {
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
                return {};
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
            }
            else {
                if (parseInt(fractionalNonZeroStr[nonZeroDigits]) < 5) {
                    fractionalNonZeroStr = fractionalNonZeroStr.substring(0, nonZeroDigits);
                }
                else {
                    fractionalNonZeroStr = (parseInt(fractionalNonZeroStr.substring(0, nonZeroDigits)) + 1).toString();
                    // If overflow occurs (e.g., 999 + 1 = 1000), adjust the substring length
                    if (fractionalNonZeroStr.length > nonZeroDigits) {
                        if (fractionalZeroStr.length > 0) {
                            fractionalZeroStr = fractionalZeroStr.substring(0, fractionalZeroStr.length - 1);
                        }
                        else {
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
            if (!unitPostfix)
                unitPostfix = language === 'fa' ? ' دلار' : '';
        }
        else if (template === 'irr') {
            if (!unitPostfix)
                unitPostfix = language === 'fa' ? ' ر' : ' R';
        }
        else if (template === 'irt') {
            if (!unitPostfix)
                unitPostfix = language === 'fa' ? ' ت' : ' T';
        }
        else if (template === 'percent') {
            if (language === 'en') {
                unitPostfix += '%';
            }
            else {
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
        }
        else if (outputFormat === 'markdown') {
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
            wholeNumberStr = `${nonFractionalStr.replace(thousandSeparatorRegex, ',')}${fixedDecimalZeroStr}`;
        }
        else {
            wholeNumberStr = `${nonFractionalStr.replace(thousandSeparatorRegex, ',')}.${fractionalPartStr}`;
        }
        
        out = `${sign}${unitPrefix}${wholeNumberStr}${unitPostfix}`;
        const formattedObject = {
            value: out,
            prefix: unitPrefix,
            postfix: unitPostfix,
            sign: sign,
            wholeNumber: wholeNumberStr,
        };
        // replace custom config
        formattedObject.value = ((_a = formattedObject === null || formattedObject === void 0 ? void 0 : formattedObject.value) !== null && _a !== void 0 ? _a : '')
            .replace(/,/g, thousandSeparator)
            .replace(/\./g, decimalSeparator);
        // Convert output to Persian numerals if language is "fa"
        if (language === 'fa') {
            formattedObject.value = ((_b = formattedObject === null || formattedObject === void 0 ? void 0 : formattedObject.value) !== null && _b !== void 0 ? _b : '')
                .replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 1728))
                .replace(/(K|M|B|T|Qt|Qd)/g, function (c) {
                return String(scaleUnits[c]);
            });
            formattedObject.fullPostfix = unitPostfix
                .replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 1728))
                .replace(/(K|M|B|T|Qt|Qd)/g, function (c) {
                return String(fullScaleUnits[c]);
            });
            formattedObject.postfix = formattedObject.postfix
                .replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 1728))
                .replace(/(K|M|B|T|Qt|Qd)/g, function (c) {
                return String(scaleUnits[c]);
            });
            formattedObject.wholeNumber = formattedObject.wholeNumber
                .replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 1728))
                .replace(/(K|M|B|T|Qt|Qd)/g, function (c) {
                return String(scaleUnits[c]);
            });
        }
        return formattedObject;
    }
}
exports.default = NumberFormatter;