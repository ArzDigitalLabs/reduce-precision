<?php
// v1.0.7 - Fixed version
namespace NumberFormatter;

class NumberFormatter
{
    private $options;
    private $languageBaseConfig = [
        'prefixMarker' => 'i',
        'postfixMarker' => 'i',
        'prefix' => '',
        'postfix' => '',
    ];

    private $defaultLanguageConfig = [
        'en' => [
            'thousandSeparator' => ',',
            'decimalSeparator' => '.',
        ],
        'fa' => [
            'thousandSeparator' => '٫',
            'decimalSeparator' => '٬',
        ],
    ];

    public function __construct($options = [])
    {
        // Initialize defaultLanguageConfig by merging base for each language
        $this->defaultLanguageConfig['en'] = array_merge($this->languageBaseConfig, $this->defaultLanguageConfig['en']);
        $this->defaultLanguageConfig['fa'] = array_merge($this->languageBaseConfig, $this->defaultLanguageConfig['fa']);

        // Start with default options (which includes 'en' specific settings)
        $newOptions = array_merge([
            'language' => 'en',
            'template' => 'number',
            'precision' => 'high',
            'outputFormat' => 'plain',
        ], $this->defaultLanguageConfig['en']);

        // If a language is specified in the incoming options,
        // apply the defaults for that language first.
        if (isset($options['language']) && isset($this->defaultLanguageConfig[$options['language']])) {
            $langDefaults = $this->defaultLanguageConfig[$options['language']];
            // Merge general lang defaults, then ensure the specified language itself is set, then merge specific options for that lang from $options
            $newOptions = array_merge($newOptions, $langDefaults, ['language' => $options['language']]);
        }

        // Then, apply all incoming options, allowing them to override.
        // This ensures that options like 'prefix', 'postfix', etc. from $options override language defaults if provided.
        $this->options = array_merge($newOptions, $options);
    }

    public function setLanguage($lang, $config = [])
    {
        $this->options['language'] = $lang;
        // Fallback to 'en' if the specified language or its defaults aren't fully defined.
        // Ensure defaultLanguageConfig has been initialized (e.g. by constructor having run)
        if (!isset($this->defaultLanguageConfig[$lang]) || !is_array($this->defaultLanguageConfig[$lang])) {
             // This case should ideally not happen if languages are pre-configured in constructor
            $langDefaults = $this->defaultLanguageConfig['en'];
        } else {
            $langDefaults = $this->defaultLanguageConfig[$lang];
        }
        // Ensure 'en' defaults are complete if somehow accessed before full constructor merge for 'en'
        // (though constructor order should prevent this)
        if ($lang === 'en' && ( !isset($this->defaultLanguageConfig['en']['prefixMarker']) || $this->defaultLanguageConfig['en']['prefixMarker'] === null ) ){
             $this->defaultLanguageConfig['en'] = array_merge($this->languageBaseConfig, $this->defaultLanguageConfig['en']);
             $langDefaults = $this->defaultLanguageConfig['en'];
        }


        $this->options['prefixMarker'] = $config['prefixMarker'] ?? $langDefaults['prefixMarker'];
        $this->options['postfixMarker'] = $config['postfixMarker'] ?? $langDefaults['postfixMarker'];
        $this->options['prefix'] = $config['prefix'] ?? $langDefaults['prefix'];
        $this->options['postfix'] = $config['postfix'] ?? $langDefaults['postfix'];
        $this->options['thousandSeparator'] = $config['thousandSeparator'] ?? $langDefaults['thousandSeparator'];
        $this->options['decimalSeparator'] = $config['decimalSeparator'] ?? $langDefaults['decimalSeparator'];
        return $this;
    }

    public function setTemplate($template, $precision)
    {
        $this->options['template'] = $template;
        $this->options['precision'] = $precision;
        return $this;
    }

    public function toJson($input)
    {
        $formattedObject = $this->format($input);
        unset($formattedObject['value']);
        return $formattedObject;
    }

    public function toString($input)
    {
        $formattedObject = $this->format($input);
        return $formattedObject['value'] ?? '';
    }

    public function toPlainString($input)
    {
        $this->options['outputFormat'] = 'plain';
        $formattedObject = $this->format($input);
        return $formattedObject['value'] ?? '';
    }

    public function toHtmlString($input)
    {
        $this->options['outputFormat'] = 'html';
        $formattedObject = $this->format($input);
        return $formattedObject['value'] ?? '';
    }

    public function toMdString($input)
    {
        $this->options['outputFormat'] = 'markdown';
        $formattedObject = $this->format($input);
        return $formattedObject['value'] ?? '';
    }

    // FIXED: Updated regex to handle both positive and negative exponents
    private function isENotation($input)
    {
        return preg_match('/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)$/', $input);
    }

    private function format($input)
    {
        $precision = $this->options['precision'];
        $template = $this->options['template'];
        $language = $this->options['language'];
        $outputFormat = $this->options['outputFormat'];
        $prefixMarker = $this->options['prefixMarker'];
        $postfixMarker = $this->options['postfixMarker'];
        $prefix = $this->options['prefix'];
        $postfix = $this->options['postfix'];

        // Check if the input is null or empty but not 0
        if ($input === null || $input === '') {
            return [];
        }

        // Store original input string to preserve format for trailing zeros
        $originalInput = (string)$input;

        if (!preg_match('/^(number|usd|irt|irr|percent)$/i', $template)) {
            $template = 'number';
        }

        if ($this->isENotation((string)$input)) {
            $input = $this->convertENotationToRegularNumber((float)$input, $originalInput);
        }

        $numberString = (string)$input;
        $numberString = preg_replace_callback('/[\x{0660}-\x{0669}\x{06F0}-\x{06F9}]/u', function ($match) {
            return mb_chr(ord($match[0]) - 1728);
        }, $numberString);
        $numberString = preg_replace('/[^\d.-]/', '', $numberString);

        // Stripping leading zeros only, preserve trailing zeros
        $numberString = preg_replace('/^0+(?=\d)/', '', $numberString);

        $number = abs((float)$numberString);

        $p = $d = $r = $c = $f = 0;

        // Auto precision selection
        if ($precision === 'auto') {
            if (preg_match('/^(usd|irt|irr)$/i', $template)) {
                if ($number >= 0.0001 && $number < 100000000000) {
                    $precision = 'high';
                } else {
                    $precision = 'medium';
                }
            } elseif ($template === 'number') {
                $precision = 'medium';
            } elseif ($template === 'percent') {
                $precision = 'low';
            }
        }

        if ($precision === 'medium') {
            if ($number >= 0 && $number < 0.0001) {
                $p = 33;
                $d = 4;
                $r = false;
                $c = true;
            } elseif ($number >= 0.0001 && $number < 0.001) {
                $p = 7;
                $d = 4;
                $r = false;
                $c = false;
            } elseif ($number >= 0.001 && $number < 0.01) {
                $p = 5;
                $d = 3;
                $r = false;
                $c = false;
            } elseif ($number >= 0.001 && $number < 0.1) {
                $p = 3;
                $d = 2;
                $r = false;
                $c = false;
            } elseif ($number >= 0.1 && $number < 1) {
                $p = 1;
                $d = 1;
                $r = false;
                $c = false;
            } elseif ($number >= 1 && $number < 10) {
                $p = 3;
                $d = 3;
                $r = false;
                $c = false;
            } elseif ($number >= 10 && $number < 100) {
                $p = 2;
                $d = 2;
                $r = false;
                $c = false;
            } elseif ($number >= 100 && $number < 1000) {
                $p = 1;
                $d = 1;
                $r = false;
                $c = false;
            } elseif ($number >= 1000) {
                $x = floor(log10($number)) % 3;
                $p = 2 - $x;
                $d = 2 - $x;
                $r = true;
                $c = true;
            } else {
                $p = 0;
                $d = 0;
                $r = true;
                $c = true;
            }
        } elseif ($precision === 'low') {
            if ($number >= 0 && $number < 0.01) {
                $p = 4; // Was 2
                $d = 2; // Was 0
                $r = true;
                $c = false;
                $f = 2;
            } elseif ($number >= 0.01 && $number < 0.1) {
                $p = 2;
                $d = 1;
                $r = true;
                $c = false;
            } elseif ($number >= 0.1 && $number < 1) {
                $p = 2;
                $d = 2;
                $r = true;
                $c = false;
            } elseif ($number >= 1 && $number < 10) {
                $p = 2;
                $d = 2;
                $r = true;
                $c = false;
                $f = 2;
            } elseif ($number >= 10 && $number < 100) {
                $p = 1;
                $d = 1;
                $r = true;
                $c = false;
                $f = 1;
            } elseif ($number >= 100 && $number < 1000) {
                $p = 0;
                $d = 0;
                $r = true;
                $c = false;
            } elseif ($number >= 1000) {
                $x = floor(log10($number)) % 3;
                $p = 1 - $x;
                $d = 1 - $x;
                $r = true;
                $c = true;
            } else {
                $p = 0;
                $d = 0;
                $r = true;
                $c = true;
                $f = 2;
            }
        } else {
            // precision === "high"
            if ($number >= 0 && $number < 1) {
                $p = 33;
                $d = 4;
                $r = false;
                $c = false;
            } elseif ($number >= 1 && $number < 10) {
                $p = 3;
                $d = 3;
                $r = true;
                $c = false;
            } elseif ($number >= 10 && $number < 100) {
                $p = 2;
                $d = 2;
                $r = true;
                $c = false;
            } elseif ($number >= 100 && $number < 1000) {
                $p = 2;
                $d = 2;
                $r = true;
                $c = false;
            } elseif ($number >= 1000 && $number < 10000) {
                $p = 1;
                $d = 1;
                $r = true;
                $c = false;
            } else {
                $p = 0;
                $d = 0;
                $r = true;
                $c = false;
            }
        }

        // For scientific notation, increase precision to ensure correct representation
        if ($this->isENotation($originalInput)) {
            // $p = max($p, 20); // Removed: $p from precision settings should be respected.
                                // convertENotationToRegularNumber produces enough digits.
                                // reducePrecision will truncate to $p from settings.
            $r = false; // Rounding is usually not desired for E-notation raw conversion
        }

        return $this->reducePrecision(
            $numberString, 
            $p, 
            $d, 
            $r, 
            $c, 
            $f, 
            $template, 
            $language, 
            $outputFormat, 
            $prefixMarker, 
            $postfixMarker, 
            $prefix, 
            $postfix,
            $originalInput
        );
    }

    private function reducePrecision(
        $numberString, 
        $precision = 30, 
        $nonZeroDigits = 4, 
        $round = false, 
        $compress = false, 
        $fixedDecimalZeros = 0, 
        $template = 'number', 
        $language = 'en', 
        $outputFormat = 'plain', 
        $prefixMarker = 'span', 
        $postfixMarker = 'span', 
        $prefix = '', 
        $postfix = '',
        $originalInput = ''
    ) {
        if ($numberString === null || (is_string($numberString) && trim($numberString) === '')) {
            return [];
        }
        // Ensure numberString is a string for subsequent operations
        $numberString = (string)$numberString;

        // FIXED: Handle negative zero
        if ($numberString === '-0' || $numberString === '-0.0') {
            $numberString = substr($numberString, 1); // Remove negative sign for zero
        }

        $maxPrecision = 30;
        $maxIntegerDigits = 21;

        $scaleUnits = preg_match('/^(number|percent)$/i', $template)
            ? [
                '' => '',
                'K' => ' هزار',
                'M' => ' میلیون',
                'B' => ' میلیارد',
                'T' => ' تریلیون',
                'Qd' => ' کادریلیون',
                'Qt' => ' کنتیلیون',
            ]
            : [
                '' => '',
                'K' => ' هزار ت',
                'M' => ' میلیون ت',
                'B' => ' میلیارد ت',
                'T' => ' همت',
                'Qd' => ' هزار همت',
                'Qt' => ' میلیون همت',
            ];

        // Add fullScaleUnits, similar to ts/js
        $fullScaleUnits = preg_match('/^(number|percent)$/i', $template)
          ? [
                '' => '', 'K' => ' هزار', 'M' => ' میلیون', 'B' => ' میلیارد',
                'T' => ' تریلیون', 'Qd' => ' کادریلیون', 'Qt' => ' کنتیلیون',
            ]
          : [
                '' => '', 'K' => ' هزار تومان', 'M' => ' میلیون تومان', 'B' => ' میلیارد تومان',
                'T' => ' هزار میلیارد تومان', 'Qd' => ' کادریلیون تومان', 'Qt' => ' کنتیلیون تومان',
            ];

        $parts = [];
        // Changed \d+ to \d* for the non-fractional part
        preg_match('/^(-)?(\d*)\.?([0]*)(\d*)$/u', $numberString, $parts);

        if (empty($parts)) {
            // This case should ideally not be reached if numberString is validated,
            // but as a fallback.
            return [];
        }

        $sign = $parts[1] ?? '';
        $nonFractionalStr = $parts[2] ?? '';
        if ($nonFractionalStr === '') {
            $nonFractionalStr = '0';
        }
        $fractionalZeroStr = $parts[3] ?? '';
        $fractionalNonZeroStr = $parts[4] ?? '';

        $unitPrefix = '';
        $unitPostfix = '';

        if (strlen($fractionalZeroStr) >= $maxPrecision) {
            // Number is smaller than maximum precision
            $fractionalZeroStr = str_pad('', $maxPrecision - 1, '0');
            $fractionalNonZeroStr = '1';
        } elseif (strlen($fractionalZeroStr) + $nonZeroDigits > $precision) {
            // decrease non-zero digits
            $nonZeroDigits = $precision - strlen($fractionalZeroStr);
            if ($nonZeroDigits < 1) {
                $nonZeroDigits = 1;
            }
        } elseif (strlen($nonFractionalStr) > $maxIntegerDigits) {
            $nonFractionalStr = '0';
            $fractionalZeroStr = '';
            $fractionalNonZeroStr = '';
        }

        // compress large numbers
        if ($compress && strlen($nonFractionalStr) >= 4) {
            $scaleUnitKeys = array_keys($scaleUnits);
            $scaledWholeNumber = $nonFractionalStr;
            $unitIndex = 0;
            while ((int)$scaledWholeNumber > 999 && $unitIndex < count($scaleUnitKeys) - 1) {
                $scaledWholeNumber = number_format((float)$scaledWholeNumber / 1000, 2, '.', '');
                $unitIndex++;
            }
            $unitPostfix = $scaleUnitKeys[$unitIndex];

            if ($language == 'fa') {
                $unitPostfix = $scaleUnits[$scaleUnitKeys[$unitIndex]];
            }

            preg_match('/^(-)?(\d+)\.?([0]*)(\d*)$/u', $scaledWholeNumber, $parts);
            if (empty($parts)) {
                return [];
            }
            $nonFractionalStr = $parts[2];
            $fractionalZeroStr = $parts[3];
            $fractionalNonZeroStr = $parts[4];
        }

        // Truncate the fractional part or round it
        if (strlen($fractionalNonZeroStr) > $nonZeroDigits) {
            if (!$round) {
                $fractionalNonZeroStr = substr($fractionalNonZeroStr, 0, $nonZeroDigits);
            } else {
                if ((int)$fractionalNonZeroStr[$nonZeroDigits] < 5) {
                    $fractionalNonZeroStr = substr($fractionalNonZeroStr, 0, $nonZeroDigits);
                } else {
                    $fractionalNonZeroStr = (string)((int)substr($fractionalNonZeroStr, 0, $nonZeroDigits) + 1);
                    // If overflow occurs (e.g., 999 + 1 = 1000), adjust the substring length
                    if (strlen($fractionalNonZeroStr) > $nonZeroDigits) {
                        if (strlen($fractionalZeroStr) > 0) {
                            $fractionalZeroStr = substr($fractionalZeroStr, 0, -1);
                        } else {
                            $nonFractionalStr = (string)((float)$nonFractionalStr + 1);
                            $fractionalNonZeroStr = substr($fractionalNonZeroStr, 1);
                        }
                    }
                }
            }
        }

        // Using dex style
        if ($compress && $fractionalZeroStr !== '' && $unitPostfix === '') {
            $fractionalZeroStr = '0' . preg_replace_callback('/\d/', function ($match) {
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
                ][$match[0]];
            }, (string)strlen($fractionalZeroStr));
        }

        $fractionalPartStr = $fractionalZeroStr . $fractionalNonZeroStr;

        // Logic for $fractionalPartStr based on $originalInput and $fixedDecimalZeros
        if ($this->isENotation($originalInput)) {
            // If original was E-notation, use the decimal part from the already converted $numberString
            $partsFromConverted = explode('.', $numberString, 2);
            $currentFractionalPart = $partsFromConverted[1] ?? '';
            // If the E-notation converted to an integer (e.g. 1e3 -> 1000), there's no fractional part from it.
            // In this case, $fractionalPartStr (from $fractionalZeroStr . $fractionalNonZeroStr) might be relevant if any rounding created it.
            // However, typically for E-notation, we want its precise decimal value or what $originalInput implies.
            // Let's assume $numberString is the definitive plain version.
            $fractionalPartStr = $currentFractionalPart;
            // If $fixedDecimalZeros is active AND the number string from e-notation is an integer (e.g. "1000" from 1e3)
            // AND originalInput did not have a decimal (e.g. "1e3" not "1.0e3")
            // This is complex. The TS logic is: if originalInput has '.', use its decimal part.
            // Else (no decimal in originalInput OR originalInput was E-notation that resolved to integer):
            //   apply fixedDecimalZeros if fractionalPart is empty
            //   else if fractionalPart > precision and not E-notation, truncate.
            // The key is: if originalInput is E-notation, its *original form* does not dictate trailing zeros
            // like "1.20" does. Instead, its *value* dictates the digits.
            // The $numberString (e.g. "0.000010") is the value. Its fractional part is "000010".
            // This "000010" should be subject to $precision.
             if (strlen($fractionalPartStr) > $precision) {
                 $fractionalPartStr = substr($fractionalPartStr, 0, $precision);
             }

        } elseif (strpos($originalInput, '.') !== false) { // Original input was not E-notation, but has a decimal
            $originalDecimalPart = explode('.', $originalInput, 2)[1] ?? '';
            // Default to original decimal part
            $fractionalPartStr = $originalDecimalPart;

            // Special case: if $originalInput ends with "." (e.g. "0.", "123.")
            // AND its decimal part is empty
            // AND $fixedDecimalZeros is applicable
            // AND template is percent (more targeted fix)
            if (substr($originalInput, -1) === '.' && $originalDecimalPart === '' && $fixedDecimalZeros > 0 && $template === 'percent') {
                $fractionalPartStr = str_pad('', $fixedDecimalZeros, '0');
            }
            // Note: No further truncation based on $precision here for other cases, as originalInput's decimal part is king.
        } else { // Original input was not E-notation and no decimal (integer string or empty)
            // $fractionalPartStr is still $fractionalZeroStr . $fractionalNonZeroStr
            if ($fixedDecimalZeros > 0 && $fractionalPartStr === '') {
                $fractionalPartStr = str_pad('', $fixedDecimalZeros, '0');
            } elseif (strlen($fractionalPartStr) > $precision) {
                // This is the original truncation logic if not guided by originalInput's decimal.
                // Added check to avoid truncating if originalInput was E, which is handled above.
                $fractionalPartStr = substr($fractionalPartStr, 0, $precision);
            }
        }

        // Output Formating, Prefix, Postfix
        if ($template === 'usd') {
            $unitPrefix = $language === 'en' ? '$' : '';
            if (!$unitPostfix) {
                $unitPostfix = $language === 'fa' ? ' دلار' : '';
            }
        } elseif ($template === 'irr') {
            if (!$unitPostfix) {
                $unitPostfix = $language === 'fa' ? ' ر' : ' R';
            }
        } elseif ($template === 'irt') {
            if (!$unitPostfix) {
                $unitPostfix = $language === 'fa' ? ' ت' : ' T';
            }
        } elseif ($template === 'percent') {
            if ($language === 'en') {
                $unitPostfix .= '%';
            } else {
                $unitPostfix .= !$unitPostfix ? '٪' : ' درصد';
            }
        }
        $unitPrefix = $prefix . $unitPrefix;
        $unitPostfix .= $postfix;

        if ($outputFormat === 'html') {
            if ($unitPrefix) {
                $unitPrefix = '<' . $prefixMarker . '>' . $unitPrefix . '</' . $prefixMarker . '>';
            }
            if ($unitPostfix) {
                $unitPostfix = '<' . $postfixMarker . '>' . $unitPostfix . '</' . $postfixMarker . '>';
            }
        } elseif ($outputFormat === 'markdown') {
            if ($unitPrefix) {
                $unitPrefix = $prefixMarker . $unitPrefix . $prefixMarker;
            }
            if ($unitPostfix) {
                $unitPostfix = $postfixMarker . $unitPostfix . $postfixMarker;
            }
        }

        // Fetch separators from $this->options
        $optionsThousandSeparator = $this->options['thousandSeparator'] ?? ',';
        $optionsDecimalSeparator = $this->options['decimalSeparator'] ?? '.';

        // Convert $nonFractionalStr to float for number_format, then to string.
        // number_format will use standard English comma for thousands if a separator isn't specified for it.
        // We want to apply the $optionsThousandSeparator.
        // The easiest way to apply a custom thousand separator is often string replacement after formatting with a placeholder,
        // or by formatting without a thousand separator and then manually inserting it.
        // For simplicity with number_format, we format without its own thousands, then add ours.
        // However, the provided TS/JS logic implies direct construction.
        // Let's use number_format for the number part, then replace.

        // First, ensure $nonFractionalStr is just digits for number_format if it's being used for formatting the number itself.
        // Or, more simply, apply thousand separator using regex substitution if $nonFractionalStr is already prepared.
        $tempFormattedNonFractionalStr = preg_replace('/\B(?=(\d{3})+(?!\d))/', '$PLACEHOLDER$', $nonFractionalStr);
        $formattedNonFractionalStr = str_replace('$PLACEHOLDER$', $optionsThousandSeparator, $tempFormattedNonFractionalStr);

        if ($nonFractionalStr === '0' && $originalInput !== '' && $originalInput[0] === '.') {
           $formattedNonFractionalStr = '0';
        }
        
        $wholeNumberStr = '';
        if (strpos($originalInput, '.') !== false) {
            $endsWithDecimal = substr($originalInput, -1) === '.';
            if ($fractionalPartStr === '' && !$endsWithDecimal) {
                $wholeNumberStr = $formattedNonFractionalStr;
            } else {
                $wholeNumberStr = $formattedNonFractionalStr . $optionsDecimalSeparator . $fractionalPartStr;
            }
        } else {
            // originalInput does not contain "."
            if (strlen($fractionalPartStr) > 0) {
                $wholeNumberStr = $formattedNonFractionalStr . $optionsDecimalSeparator . $fractionalPartStr;
            } elseif ($fixedDecimalZeros > 0) {
                $wholeNumberStr = $formattedNonFractionalStr . $optionsDecimalSeparator . str_pad('', $fixedDecimalZeros, '0');
            } else {
                $wholeNumberStr = $formattedNonFractionalStr;
            }
        }

        $out = $sign . $unitPrefix . $wholeNumberStr . $unitPostfix;

        $formattedObject = [
            'value' => $out,
            'prefix' => $unitPrefix,
            'postfix' => $unitPostfix,
            'sign' => $sign,
            'wholeNumber' => $wholeNumberStr,
        ];

        // Final Separator Replacement and Persian Conversion
        // $optionsDecimalSeparator and $optionsThousandSeparator are already fetched

        // Ensure the final value uses the correct decimal separator.
        // $wholeNumberStr is already built with correct separators.
        // $out uses $wholeNumberStr. So $formattedObject['value'] (which is $out) should be mostly correct.
        // This is a final check for cases where '.' might have been introduced if logic above missed something.
        if ($language === 'fa' && $optionsDecimalSeparator === '٬') {
           $formattedObject['value'] = str_replace('.', $optionsDecimalSeparator, $formattedObject['value'] ?? '');
        } elseif ($optionsDecimalSeparator !== '.') {
           $formattedObject['value'] = str_replace('.', $optionsDecimalSeparator, $formattedObject['value'] ?? '');
        }
        // Thousand separators were applied during $formattedNonFractionalStr creation.

        if ($language === 'fa') {
            $val = $formattedObject['value'] ?? '';
            // Ensure correct decimal separator for 'fa' before converting numerals
            if ($optionsDecimalSeparator === '٬') {
                $val = str_replace('.', $optionsDecimalSeparator, $val); // Ensure conversion if originalInput had '.'
            }
            $val = preg_replace_callback('/[0-9]/', function ($m) { return mb_chr(ord($m[0]) + 1728); }, $val);
            // $scaleUnits should be available from earlier in the function
            $val = preg_replace_callback('/(K|M|B|T|Qt|Qd)/', function ($m) use ($scaleUnits) { return $scaleUnits[$m[0]] ?? $m[0]; }, $val);
            $formattedObject['value'] = $val;

            $faWholeNumber = $formattedObject['wholeNumber'];
            if ($optionsDecimalSeparator === '٬') {
                $faWholeNumber = str_replace('.', $optionsDecimalSeparator, $faWholeNumber);
            }
            $formattedObject['wholeNumber'] = preg_replace_callback('/[0-9]/', function ($m) { return mb_chr(ord($m[0]) + 1728); }, $faWholeNumber);
            // No K,M,B in wholeNumber typically

            // Add fullPostfix similar to TS
            // $fullScaleUnits should be available from earlier in the function
            $formattedObject['fullPostfix'] = preg_replace_callback('/[0-9]/', function ($m) { return mb_chr(ord($m[0]) + 1728); }, $unitPostfix); // $unitPostfix is set earlier
            $formattedObject['fullPostfix'] = preg_replace_callback('/(K|M|B|T|Qt|Qd)/', function ($m) use ($fullScaleUnits) { return $fullScaleUnits[$m[0]] ?? $m[0]; }, $formattedObject['fullPostfix']);

            $currentPostfix = $formattedObject['postfix'] ?? '';
            $currentPostfix = preg_replace_callback('/[0-9]/', function ($m) { return mb_chr(ord($m[0]) + 1728); }, $currentPostfix);
            $formattedObject['postfix'] = preg_replace_callback('/(K|M|B|T|Qt|Qd)/', function ($m) use ($scaleUnits) { return $scaleUnits[$m[0]] ?? $m[0]; }, $currentPostfix);
        } else {
            // Ensure correct decimal separator for non-'fa' languages if it's not '.'
            if ($optionsDecimalSeparator !== '.') {
                // $formattedObject['value'] already handled by the check before 'fa' block
                $formattedObject['wholeNumber'] = str_replace('.', $optionsDecimalSeparator, $formattedObject['wholeNumber']);
            }
        }
        return $formattedObject;
    }

    // FIXED: Improved scientific notation conversion
    private function convertENotationToRegularNumber($eNotation, $originalInput)
    {
        // For simple cases like 1e3, directly format as a regular number
        if (is_int($eNotation) && $eNotation >= 1000) {
            return number_format($eNotation, 0, '.', '');
        }
        
        $parts = explode('e', strtolower((string)$originalInput));
        if (count($parts) !== 2) {
            return (string)$eNotation;
        }
        
        $coefficient = (float)$parts[0];
        $exponent = (int)$parts[1];
        
        // Handle negative exponents (very small numbers)
        if ($exponent < 0) {
            $absExponent = abs($exponent);
            // Determine precision needed to show all digits
            $precision = $absExponent;
            if (strpos($parts[0], '.') !== false) {
                $precision += strlen(explode('.', $parts[0])[1]);
            }
            return number_format($eNotation, $precision, '.', '');
        }
        
        // For positive exponents, format to show as a regular number
        // Preserve precision from coefficient for positive/zero exponent
        $coeffDecimalLen = 0;
        if (strpos($parts[0], '.') !== false) {
            $coeffDecimalParts = explode('.', $parts[0], 2);
            if (isset($coeffDecimalParts[1])) {
                $coeffDecimalLen = strlen($coeffDecimalParts[1]);
            }
        }
        // $eNotation is float, ensure formatting retains those decimals
        return number_format((float)$eNotation, $coeffDecimalLen, '.', '');
    }
}