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
        // Start with default options (which includes 'en' specific settings)
        let newOptions = Object.assign({ language: 'en', template: 'number', precision: 'high', outputFormat: 'plain' }, this.defaultLanguageConfig['en']);

        // If a language is specified in the incoming options,
        // apply the defaults for that language first.
        if (options.language) {
            const langDefaults = this.defaultLanguageConfig[options.language];
            if (langDefaults) {
                newOptions = Object.assign(Object.assign({}, newOptions), Object.assign(Object.assign({}, langDefaults), { language: options.language }));
            }
        }

        // Then, apply all incoming options, allowing them to override.
        newOptions = Object.assign(Object.assign({}, newOptions), options);

        this.options = newOptions;
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
        if (input === undefined || input === null || input === '') {
            return {};
        }
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
                p = 4; // Changed from 2
                d = 2; // Changed from 0
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
        
        // Add .toString() before .trim() if numberString could be other types
        if (numberString === undefined || numberString === null || numberString.toString().trim() === '') {
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
        let parts = /^(-)?(\d*)\.?([0]*)(\d*)$/g.exec(numberString); // Changed \d+ to \d*
        if (!parts) {
            return {};
        }
        const sign = parts[1] || '';
        let nonFractionalStr = parts[2];
        nonFractionalStr = nonFractionalStr || '0'; // Handle inputs like ".123"
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
        // const fixedDecimalZeroStr = fixedDecimalZeros // This is removed as per new logic
        //     ? '.'.padEnd(fixedDecimalZeros + 1, '0')
        //     : '';
        let out = '';
        let wholeNumberStr;
        
        const formattedNonFractionalStr = nonFractionalStr.replace(thousandSeparatorRegex, thousandSeparator);

        if (originalInput.includes('.')) {
            const endsWithDecimal = originalInput.endsWith('.');
            if (fractionalPartStr === '' && !endsWithDecimal) {
                wholeNumberStr = formattedNonFractionalStr;
            } else {
                wholeNumberStr = `${formattedNonFractionalStr}${decimalSeparator}${fractionalPartStr}`;
            }
        } else {
            // originalInput does not contain "."
            if (fractionalPartStr.length > 0) {
                wholeNumberStr = `${formattedNonFractionalStr}${decimalSeparator}${fractionalPartStr}`;
            } else if (fixedDecimalZeros > 0) {
                wholeNumberStr = `${formattedNonFractionalStr}${decimalSeparator}${ ''.padEnd(fixedDecimalZeros, '0')}`;
            } else {
                wholeNumberStr = formattedNonFractionalStr;
            }
        }
        
        out = `${sign}${unitPrefix}${wholeNumberStr}${unitPostfix}`;
        const formattedObject = {
            value: out,
            prefix: unitPrefix,
            postfix: unitPostfix,
            sign: sign,
            wholeNumber: wholeNumberStr,
        };

        // Final Separator Replacement and Persian Conversion
        if (language === 'fa' && decimalSeparator === '٬') {
            // For FA with '٬', ensure internal '.' used for calculations is converted in value
           formattedObject.value = (formattedObject.value || '').replace(/\./g, decimalSeparator);
        } else if (decimalSeparator !== '.') {
            // For other languages with custom decimal separators, convert '.' to that separator
            formattedObject.value = (formattedObject.value || '').replace(/\./g, decimalSeparator);
        }
        // Note: wholeNumberStr is already constructed with the correct decimalSeparator.
        // The thousandSeparator was also applied during formattedNonFractionalStr creation.

        if (language === 'fa') {
            let val = formattedObject.value || '';
            // Ensure correct decimal separator for 'fa' before converting numerals
            // This handles cases where decimalSeparator might be '.' for fa if not '٬'
            if (decimalSeparator === '٬') {
              val = val.replace(/\./g, decimalSeparator);
            } else {
              // If 'fa' uses '.', ensure it's not doubly replaced if it was already that.
              // This path might be less common if 'fa' always implies '٬'.
            }
            val = val.replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 1728))
              .replace(/(K|M|B|T|Qt|Qd)/g, function (c) {
                return String(scaleUnits[c]);
              });
            formattedObject.value = val;

            let faWholeNumber = formattedObject.wholeNumber;
            // Also update wholeNumber's decimal separator for 'fa' before converting numerals
            if (decimalSeparator === '٬') { // Ensure internal '.' is converted
              faWholeNumber = faWholeNumber.replace(/\./g, decimalSeparator);
            }
            formattedObject.wholeNumber = faWholeNumber
              .replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 1728))
              .replace(/(K|M|B|T|Qt|Qd)/g, function (c) { // Though scale units unlikely in wholeNumber here
                return String(scaleUnits[c]);
              });

            // Add fullPostfix similar to TS
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
        } else {
            // Ensure correct decimal separator for non-'fa' languages if it's not '.'
            // This was partially handled above for formattedObject.value
            // wholeNumber should already be correct from its construction.
            if (decimalSeparator !== '.') {
                // formattedObject.value is already handled
                // wholeNumber was constructed with the correct decimalSeparator.
                // If wholeNumber somehow still has '.', this would fix it.
                // However, this might be redundant if wholeNumberStr construction is robust.
                formattedObject.wholeNumber = formattedObject.wholeNumber.replace(/\./g, decimalSeparator);
            }
        }
        return formattedObject;
    }
}
exports.default = NumberFormatter;