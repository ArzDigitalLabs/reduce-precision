<?php
namespace NumberFormatter;
class NumberFormatter {
    private $options;

    public function __construct($options = []) {
        $this->options = [
            'language' => 'en',
            'template' => 'number',
            'precision' => 'high',
            'outputFormat' => 'plain',
            'prefixMarker' => 'i',
            'postfixMarker' => 'i',
            'prefix' => '',
            'postfix' => '',
        ];
        $this->options = array_merge($this->options, $options);
    }

    public function setLanguage($lang, $config = []) {
        $this->options['language'] = $lang;
        $this->options['prefixMarker'] = $config['prefixMarker'] ?? $this->options['prefixMarker'];
        $this->options['postfixMarker'] = $config['postfixMarker'] ?? $this->options['postfixMarker'];
        $this->options['prefix'] = $config['prefix'] ?? $this->options['prefix'];
        $this->options['postfix'] = $config['postfix'] ?? $this->options['postfix'];
        return $this;
    }

    public function setTemplate($template, $precision) {
        $this->options['template'] = $template;
        $this->options['precision'] = $precision;
        return $this;
    }

    public function toJson($input) {
        $formattedObject = $this->format($input);
        unset($formattedObject['value']);
        return $formattedObject;
    }

    public function toString($input) {
        $formattedObject = $this->format($input);
        return $formattedObject['value'] ?? '';
    }

    public function toPlainString($input) {
        $this->options['outputFormat'] = 'plain';
        $formattedObject = $this->format($input);
        return $formattedObject['value'] ?? '';
    }

    public function toHtmlString($input) {
        $this->options['outputFormat'] = 'html';
        $formattedObject = $this->format($input);
        return $formattedObject['value'] ?? '';
    }

    public function toMdString($input) {
        $this->options['outputFormat'] = 'markdown';
        $formattedObject = $this->format($input);
        return $formattedObject['value'] ?? '';
    }

    // Private methods...
    private function isENotation($input) {
        return preg_match('/^[-+]?[0-9]*\.?[0-9]+([eE][-+][0-9]+)$/', $input);
    }

private function format($input) {
    $precision = $this->options['precision'];
    $template = $this->options['template'];
    $language = $this->options['language'];
    $outputFormat = $this->options['outputFormat'];
    $prefixMarker = $this->options['prefixMarker'];
    $postfixMarker = $this->options['postfixMarker'];
    $prefix = $this->options['prefix'];
    $postfix = $this->options['postfix'];

    if (empty($input)) {
        return [];
    }

    if (!preg_match('/^(number|usd|irt|irr|percent)$/i', $template)) {
        $template = 'number';
    }

    if ($this->isENotation((string)$input)) {
        $input = $this->convertENotationToRegularNumber((float)$input);
    }

    $numberString = (string)$input;
    $numberString = preg_replace_callback('/[\x{0660}-\x{0669}\x{06F0}-\x{06F9}]/u', function($match) {
        return mb_chr(ord($match[0]) - 1728);
    }, $numberString);
    $numberString = preg_replace('/[^\d.-]/', '', $numberString);

    // Stripping leading zeros and trailing zeros after a decimal point
    $numberString = preg_replace('/^0+(?=\d)/', '', $numberString);

    // $numberString = preg_replace('/(?<=\.\d*)0+$|(?<=\.\d)0+\b/', '', $numberString);

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

        return $this->reducePrecision($numberString, $p, $d, $r, $c, $f, $template, $language, $outputFormat, $prefixMarker, $postfixMarker, $prefix, $postfix);
    }
private function reducePrecision($numberString, $precision = 30, $nonZeroDigits = 4, $round = false, $compress = false, $fixedDecimalZeros = 0, $template = 'number', $language = 'en', $outputFormat = 'plain', $prefixMarker = 'span', $postfixMarker = 'span', $prefix = '', $postfix = '') {
    if (empty($numberString)) {
        return [];
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
        $fractionalZeroStr = '0' . preg_replace_callback('/\d/', function($match) {
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
    $fractionalPartStr = substr($fractionalPartStr, 0, $precision);
    $fractionalPartStr = preg_replace('/^(\d*[1-9])0+$/', '$1', $fractionalPartStr);

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
    if ($precision <= 0 || $nonZeroDigits <= 0 || !$fractionalNonZeroStr) {
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
        $formattedObject['value'] = preg_replace_callback('/[0-9]/', function($match) {
            return mb_chr(ord($match[0]) + 1728);
        }, $formattedObject['value']);
        $formattedObject['postfix'] = preg_replace_callback('/[0-9]/', function($match) {
            return mb_chr(ord($match[0]) + 1728);
        }, $formattedObject['postfix']);
        $formattedObject['wholeNumber'] = preg_replace_callback('/[0-9]/', function($match) {
            return mb_chr(ord($match[0]) + 1728);
        }, $formattedObject['wholeNumber']);
    }

    return $formattedObject;
}
    private function convertENotationToRegularNumber($eNotation) {
        // Conversion logic for E-notation to regular number
        return number_format($eNotation, 10, '.', '');
    }
}
?>
