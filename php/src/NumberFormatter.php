<?php
// v1.0.7 - Fixed version
namespace NumberFormatter;

class NumberFormatter
{
    private $options;
    private static $defaultLanguageConfig = [
        'en' => [
            'thousandSeparator' => ',',
            'decimalSeparator' => '.',
        ],
        'fa' => [
            'thousandSeparator' => '٬', // Correct: U+066C (ARABIC THOUSANDS SEPARATOR)
            'decimalSeparator' => '٫',  // Correct: U+066B (ARABIC DECIMAL SEPARATOR)
        ],
        // Add other languages here if they have specific default separators not covered by base
    ];

    public function __construct($options = [])
    {
        $initialLanguage = $options['language'] ?? 'en';

        $defaultSeparators = self::$defaultLanguageConfig[$initialLanguage] ?? self::$defaultLanguageConfig['en'];

        $baseOptions = [
            'language' => $initialLanguage,
            'template' => 'number',
            'precision' => 'high',
            'outputFormat' => 'plain',
            'prefixMarker' => 'i',
            'postfixMarker' => 'i',
            'prefix' => '',
            'postfix' => '',
            'thousandSeparator' => $defaultSeparators['thousandSeparator'],
            'decimalSeparator' => $defaultSeparators['decimalSeparator'],
        ];

        $this->options = array_merge($baseOptions, $options); // User-provided options (including potential custom separators) override defaults
    }

    public function setLanguage($lang, $config = [])
    {
        $this->options['language'] = $lang;

        $langDefaultSeparators = self::$defaultLanguageConfig[$lang] ?? self::$defaultLanguageConfig['en'];

        // Set separators from language default first
        $this->options['thousandSeparator'] = $langDefaultSeparators['thousandSeparator'];
        $this->options['decimalSeparator'] = $langDefaultSeparators['decimalSeparator'];

        // Then override with any explicit config passed to setLanguage
        $this->options['prefixMarker'] = $config['prefixMarker'] ?? $this->options['prefixMarker']; // Keeps old behavior if not in $config
        $this->options['postfixMarker'] = $config['postfixMarker'] ?? $this->options['postfixMarker'];
        $this->options['prefix'] = $config['prefix'] ?? $this->options['prefix'];
        $this->options['postfix'] = $config['postfix'] ?? $this->options['postfix'];

        // Explicit separator overrides from $config
        if (isset($config['thousandSeparator'])) {
            $this->options['thousandSeparator'] = $config['thousandSeparator'];
        }
        if (isset($config['decimalSeparator'])) {
            $this->options['decimalSeparator'] = $config['decimalSeparator'];
        }

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

        if ($template === 'liveformat') {
            $currentInput = $this->_sanitizeLiveInput($originalInput);

            $sign = '';
            if (strpos($currentInput, '-') === 0) {
                $sign = '-';
                $currentInput = substr($currentInput, 1);
            }

            $currentThousandSeparator = $this->options['thousandSeparator'] ?? ',';
            $currentDecimalSeparator = $this->options['decimalSeparator'] ?? '.';

            if ($currentInput === '') {
                return [
                    'value' => '',
                    'prefix' => '',
                    'postfix' => '',
                    'sign' => '',
                    'wholeNumber' => ''
                ];
            }

            if ($currentInput === '0') {
                $outputZero = $this->_convertToFarsiDigits('0');
                return [
                    'value' => $outputZero,
                    'prefix' => '',
                    'postfix' => '',
                    'sign' => '',
                    'wholeNumber' => $outputZero,
                ];
            }

            if ($currentInput === $currentDecimalSeparator) {
                $currentInput = '0' . $currentDecimalSeparator;
            }

            $integerPart = $currentInput;
            $decimalPart = '';
            $hasDecimalPoint = strpos($currentInput, $currentDecimalSeparator) !== false;

            if ($hasDecimalPoint) {
                $parts = explode($currentDecimalSeparator, $currentInput, 2);
                $integerPart = $parts[0];
                $decimalPart = $parts[1] ?? '';
            } else {
                // If currentInput does not contain currentDecimalSeparator (e.g. "0.0" with Farsi '٬'),
                // it might contain '.' from _sanitizeLiveInput. Check for that too.
                if ($currentDecimalSeparator !== '.' && strpos($currentInput, '.') !== false) {
                    $hasDecimalPoint = true; // We found a decimal point ('.')
                    $parts = explode('.', $currentInput, 2);
                    $integerPart = $parts[0];
                    $decimalPart = $parts[1] ?? '';
                } else {
                    // No decimal point found (neither locale specific nor '.')
                    $integerPart = $currentInput;
                }
            }

            // Now $integerPart is the true integer part.
            if ($integerPart === '') { $integerPart = '0'; }
            else if ($integerPart !== '0') {
                $tempInt = ltrim($integerPart, '0');
                $integerPart = ($tempInt === '') ? '0' : $tempInt;
            }
            // No change if $integerPart is already "0"

            if (strlen($integerPart) > 3) {
                $formattedIntegerPart = preg_replace('/\\B(?=(\\d{3})+(?!\\d))/', $currentThousandSeparator, $integerPart);
            } else {
                $formattedIntegerPart = $integerPart;
            }

            $finalAbsoluteValue = $formattedIntegerPart; // This is absolute, Western digits, locale separators
            if ($hasDecimalPoint) {
                $finalAbsoluteValue .= $currentDecimalSeparator . $decimalPart;
            }

            $resultSign = '';
            if ($sign === '-') {
                // Use $finalAbsoluteValue (Western digits, locale separator) for floatval check
                // Need to replace locale decimal with '.' for floatval if they differ
                $valueForFloatval = str_replace($currentDecimalSeparator, '.', $finalAbsoluteValue);
                if (floatval($valueForFloatval) === 0.0 && strpos($finalAbsoluteValue, $currentDecimalSeparator) === false) {
                    $resultSign = '';
                } else {
                    $resultSign = '-';
                }
            }

            $farsiOrWesternAbsoluteValue = $this->_convertToFarsiDigits($finalAbsoluteValue);
            $finalDisplayValue = ($resultSign === '-' ? '-' : '') . $farsiOrWesternAbsoluteValue;

            return [
                'value' => $finalDisplayValue,
                'prefix' => '',
                'postfix' => '',
                'sign' => $resultSign,
                'wholeNumber' => $finalDisplayValue,
            ];
        }

        if (!preg_match('/^(number|usd|irt|irr|percent|liveformat)$/i', $template)) {
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
                $p = 2;
                $d = 0;
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
            $p = max($p, 20);
            $r = false;
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
        if ($numberString === null || $numberString === '') {
            return [];
        }

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

        $parts = [];
        preg_match('/^(-)?(\d+)\.?([0]*)(\d*)$/u', $numberString, $parts);

        if (empty($parts)) {
            return [];
        }

        $sign = isset($parts[1]) ? $parts[1] : '';
        $nonFractionalStr = $parts[2];
        $fractionalZeroStr = $parts[3];
        $fractionalNonZeroStr = $parts[4];

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
        
        // FIXED: Don't truncate trailing zeros when they're in the original string
        if (strlen($fractionalPartStr) > $precision && !strpos($originalInput, 'e') && !strpos($originalInput, 'E')) {
            $fractionalPartStr = substr($fractionalPartStr, 0, $precision);
        }
        
        // FIXED: For numbers with decimal point, check for trailing zeros
        // Also ensure it's not an E-notation string where trailing zeros have different meaning
        if (strpos($originalInput, '.') !== false && !strpos(strtolower($originalInput), 'e')) {
            $originalParts = explode('.', $originalInput);
            if (count($originalParts) === 2) {
                $originalDecimal = $originalParts[1];
                // If original has more digits than what we have now, preserve those trailing zeros
                if (strlen($originalDecimal) > strlen($fractionalPartStr) && substr($originalDecimal, -1) === '0') {
                    // Count trailing zeros in original
                    $trailingZeros = 0;
                    for ($i = strlen($originalDecimal) - 1; $i >= 0; $i--) {
                        if ($originalDecimal[$i] === '0') {
                            $trailingZeros++;
                        } else {
                            break;
                        }
                    }
                    // Add back trailing zeros if they were in the original
                    if ($trailingZeros > 0) {
                        $fractionalPartStr = str_pad($fractionalPartStr, strlen($fractionalPartStr) + $trailingZeros, '0');
                    }
                }
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

        $thousandSeparatorRegex = '/\B(?=(\d{3})+(?!\d))/';

        $fixedDecimalZeroStr = $fixedDecimalZeros
            ? str_pad('.', $fixedDecimalZeros + 1, '0')
            : '';

        $wholeNumberStr = '';
        
        // FIXED: Changed condition to correctly handle numbers with trailing zeros
        if ($precision <= 0 || $nonZeroDigits <= 0 || ($fractionalNonZeroStr === '' && $fractionalZeroStr === '')) {
            $wholeNumberStr = number_format((float)$nonFractionalStr, 0, '', ',') . $fixedDecimalZeroStr;
        } else {
            $wholeNumberStr = number_format((float)$nonFractionalStr, 0, '', ',') . '.' . $fractionalPartStr;
        }

        $out = $sign . $unitPrefix . $wholeNumberStr . $unitPostfix;

        $formattedObject = [
            'value' => $out,
            'prefix' => $unitPrefix,
            'postfix' => $unitPostfix,
            'sign' => $sign,
            'wholeNumber' => $wholeNumberStr,
        ];

        // Convert output to Persian numerals if language is "fa"
        if ($language === 'fa') {
            $formattedObject['value'] = preg_replace_callback('/[0-9]/', function ($match) {
                return mb_chr(ord($match[0]) + 1728);
            }, $formattedObject['value']);
            $formattedObject['postfix'] = preg_replace_callback('/[0-9]/', function ($match) {
                return mb_chr(ord($match[0]) + 1728);
            }, $formattedObject['postfix']);
            $formattedObject['wholeNumber'] = preg_replace_callback('/[0-9]/', function ($match) {
                return mb_chr(ord($match[0]) + 1728);
            }, $formattedObject['wholeNumber']);
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
        
        // For positive exponents or exponent = 0
        if ($exponent == 0) {
            return $parts[0]; // Return the coefficient as is, e.g., "1.23" for "1.23e0"
        }
        // Positive exponent: Manually reconstruct the number
        // This is a simplified version; a more robust one would handle various coefficient formats.
        list($integer, $fraction) = array_pad(explode('.', $parts[0]), 2, '');
        $fraction = $fraction ?? '';

        if ($exponent > 0) {
            if (strlen($fraction) <= $exponent) {
                return $integer . str_pad($fraction, $exponent, '0', STR_PAD_RIGHT);
            } else {
                return $integer . substr($fraction, 0, $exponent) . '.' . substr($fraction, $exponent);
            }
        }
        // Should not be reached if logic is correct for exp < 0, exp == 0, exp > 0
        return (string)$eNotation; // Fallback
    }

    // Place this method within the NumberFormatter class in php/src/NumberFormatter.php
    private function _sanitizeLiveInput(string $input): string
    {
        $sanitizedInput = $input;

        // 1. Convert Farsi/Arabic numerals to Western numerals
        // Eastern Arabic Numerals (e.g., ٠١٢)
        $sanitizedInput = preg_replace_callback(
            '/[\x{0660}-\x{0669}]/u',
            function ($matches) {
                return (string) (mb_ord($matches[0], 'UTF-8') - mb_ord('٠', 'UTF-8'));
            },
            $sanitizedInput
        );
        // Persian Numerals (e.g., ۰۱۲)
        $sanitizedInput = preg_replace_callback(
            '/[\x{06F0}-\x{06F9}]/u',
            function ($matches) {
                return (string) (mb_ord($matches[0], 'UTF-8') - mb_ord('۰', 'UTF-8'));
            },
            $sanitizedInput
        );

        // 2. Handle potential E-notation
        // Temporarily normalize Farsi decimal separator '٬' to '.' for E-notation processing
        $stringForENotationProcessing = $sanitizedInput;
        $originalSeparator = null;

        if (($this->options['language'] ?? 'en') === 'fa') {
            $farsiDecimal = self::$defaultLanguageConfig['fa']['decimalSeparator'] ?? '٬';
            if (strpos($sanitizedInput, $farsiDecimal) !== false) {
                $originalSeparator = $farsiDecimal; // Remember if we changed it
                $stringForENotationProcessing = str_replace($farsiDecimal, '.', $sanitizedInput);
            }
        }

        if ($this->isENotation($stringForENotationProcessing)) {
            // Pass the string with '.' as decimal for float conversion and as the "original" E-string
            $convertedValue = $this->convertENotationToRegularNumber((float)$stringForENotationProcessing, $stringForENotationProcessing);
            // If we had replaced a Farsi separator, and the result still has a '.', change it back
            if ($originalSeparator && strpos($convertedValue, '.') !== false) {
                 $sanitizedInput = str_replace('.', $originalSeparator, $convertedValue);
            } else {
                 $sanitizedInput = $convertedValue;
            }
        }
        // If not E-notation, $sanitizedInput (with original separators after Farsi digit conversion) is returned.

        return $sanitizedInput;
    }

  private function _convertToFarsiDigits(string $value): string
  {
      // Ensure language is 'fa' and value is not null/empty
      if (($this->options['language'] ?? 'en') !== 'fa' || $value === null || $value === '') {
          return $value;
      }

      // Convert Western digits (0-9) to Eastern Arabic Numerals (٠-٩)
      // This matches the existing behavior in the reducePrecision method for Farsi output.
      return preg_replace_callback('/[0-9]/', function ($match) {
          // ord() is safe here as $match[0] will be a single byte Western digit '0'-'9'
          return mb_chr(ord($match[0]) + 1728, 'UTF-8');
      }, $value);
  }
}