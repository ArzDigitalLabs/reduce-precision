<?php

use PHPUnit\Framework\TestCase;
use NumberFormatter\NumberFormatter; // Import the class with the namespace
require_once __DIR__ . '/../src/NumberFormatter.php'; // Adjust the path if necessary

class NumberFormatterTest extends TestCase
{
    public function testDefaultFormat()
    {
        $formatter = new NumberFormatter([
            'language' => 'fa',
            'template' => 'usd',
            'precision' => 'auto'
        ]);
        $this->assertEquals('۴۲۳ میلیون همت', $formatter->toString('423000000000000000000'));
    }

    public function testSetLanguage()
    {
        $formatter = new NumberFormatter();
        $formatter->setLanguage('en', ['prefixMarker' => 'span', 'postfixMarker' => 'span', 'prefix' => '', 'postfix' => '']);
        // exit(var_dump($formatter->toString('123')));
        $this->assertEquals('123', $formatter->toHtmlString('123'));
    }

    public function testSetTemplate()
    {
        $formatter = new NumberFormatter();
        $formatter->setTemplate('usd', 'high');
        $this->assertEquals('$123', $formatter->toString('123'));
    }

    // public function testToJson()
    // {
    //     $formatter = new NumberFormatter();
    //     $this->assertJsonStringEqualsJsonString( json_decode(['prefix'=> '', 'postfix'=> '', 'sign'=> '', 'wholeNumber'=> '123' ]), $formatter->toJson('123'));
    // }

    public function testToPlainString()
    {
        $formatter = new NumberFormatter();
        $this->assertEquals('123', $formatter->toPlainString('123'));
    }

    public function testToHtmlString()
    {
        $formatter = new NumberFormatter();
        $this->assertEquals('123', $formatter->toHtmlString('123'));
    }

    public function testToMdString()
    {
        $formatter = new NumberFormatter();
        $this->assertEquals('123', $formatter->toMdString('123'));
    }

    public function testENotationConversion()
    {
        $formatter = new NumberFormatter();
        $this->assertEquals('1.23', $formatter->toString('1.23e0'));
        $this->assertEquals('1,230', $formatter->toString('1.23e3')); // Corrected expectation
        $this->assertEquals('0.00123', $formatter->toString('1.23e-3'));
    }

    public function testMediumPrecision()
    {
        $formatter = new NumberFormatter(['precision' => 'medium']);
        $this->assertEquals('0.0001', $formatter->toString('0.0001'));
        $this->assertEquals('0.01', $formatter->toString('0.01'));
        $this->assertEquals('0.1', $formatter->toString('0.1'));
        $this->assertEquals('1', $formatter->toString('1'));
        $this->assertEquals('10', $formatter->toString('10'));
    }

    public function testLowPrecision()
    {
        $formatter = new NumberFormatter(['precision' => 'low']);
        $this->assertEquals('0.00', $formatter->toString('0.0001'));
        $this->assertEquals('0.01', $formatter->toString('0.01'));
        $this->assertEquals('0.1', $formatter->toString('0.1'));
        $this->assertEquals('1.00', $formatter->toString('1'));
        $this->assertEquals('10.0', $formatter->toString('10'));
    }

    public function testHighPrecision()
    {
        $formatter = new NumberFormatter(['precision' => 'high']);
        $this->assertEquals('0.0001', $formatter->toString('0.0001'));
        $this->assertEquals('0.01', $formatter->toString('0.01'));
        $this->assertEquals('0.1', $formatter->toString('0.1'));
        $this->assertEquals('1', $formatter->toString('1'));
        $this->assertEquals('10', $formatter->toString('10'));
    }

    public function testLiveformatTemplate()
    {
        $formatter = new NumberFormatter(['template' => 'liveformat']);

        $testCases = [
            ['input' => '0', 'expected' => '0'],
            ['input' => '02', 'expected' => '2'],
            ['input' => '29', 'expected' => '29'],
            ['input' => '2923', 'expected' => '2,923'],
            ['input' => '2923123', 'expected' => '2,923,123'],
            ['input' => '2923123.', 'expected' => '2,923,123.'],
            ['input' => '2923123.00', 'expected' => '2,923,123.00'],
            ['input' => '', 'expected' => ''],
            ['input' => '.', 'expected' => '0.'],
            ['input' => '0.0', 'expected' => '0.0'], // String input
            ['input' => '.5', 'expected' => '0.5'],
            ['input' => '007', 'expected' => '7'],
            ['input' => '00.25', 'expected' => '0.25'],
            // E-notation inputs (as strings, or stringified from float)
            ['input' => '1.23e-7', 'expected' => '0.000000123'],
            ['input' => (string)0.000000123, 'expected' => '0.000000123'], // Stringified float '1.23E-7'
            ['input' => '1.23e+8', 'expected' => '123,000,000'],
            ['input' => (string)1.23e+8, 'expected' => '123,000,000'], // Stringified float '1.23E+8'
            ['input' => '0.0e0', 'expected' => '0.0'], // PHP _sanitizeLiveInput converts "0.0e0" to "0.0", liveformat preserves this.
            // Negative numbers
            ['input' => '-0', 'expected' => '0'],
            ['input' => '-0.5', 'expected' => '-0.5'],
            ['input' => '-1234.56', 'expected' => '-1,234.56'],
            ['input' => '-0.0', 'expected' => '-0.0'], // String input
            ['input' => (string)-0.000000123, 'expected' => '-0.000000123'], // Stringified float '-1.23E-7'
        ];

        foreach ($testCases as $case) {
            $this->assertSame($case['expected'], $formatter->toPlainString($case['input']), "Input: {$case['input']}");
        }
    }

    public function testLiveformatTemplateFarsi()
    {
        // Confirmed Farsi Separators: Thousands: ٬ (U+066C), Decimal: ٫ (U+066B)
        // PHP Output Digits: Persian Numerals ۰۱۲... (U+06F0 range)
        $formatter = new NumberFormatter(['template' => 'liveformat', 'language' => 'fa']);

        $farsiTestCases = [
            ['input' => '۱۲۳۴', 'expected' => '۱٬۲۳۴'],
            ['input' => '۱۲۳۴۵٫۶۷', 'expected' => '۱۲٬۳۴۵٫۶۷'],
            ['input' => '-۷۸۹٫۰۱', 'expected' => '-۷۸۹٫۰۱'],
            ['input' => '۰', 'expected' => '۰'],
            ['input' => '-۰', 'expected' => '۰'],
            ['input' => '۰٫۱۲', 'expected' => '۰٫۱۲'],
            ['input' => '-۰٫۱۲', 'expected' => '-۰٫۱۲'],
            ['input' => '۱۲۳۴۵۶۷۸۹٫۱۲۳', 'expected' => '۱۲۳٬۴۵۶٬۷۸۹٫۱۲۳'],
            ['input' => '1۲۳۴٫۵۶', 'expected' => '۱٬۲۳۴٫۵۶'],
            ['input' => '٫', 'expected' => '۰٫'],
            ['input' => '۹۳۱۲۸۳٫۰۰۰۹۱۲۳', 'expected' => '۹۳۱٬۲۸۳٫۰۰۰۹۱۲۳'],
            // User case 2 (Western input "39312312.123123", lang 'fa')
            // PHP code has a fallback to process '.' as decimal if locale decimal '٫' is not found.
            ['input' => '39312312.123123', 'expected' => '۳۹٬۳۱۲٬۳۱۲٫۱۲۳۱۲۳'],
            ['input' => '۱۲۳۴۵۶۷', 'expected' => '۱٬۲۳۴٬۵۶۷'],
            ['input' => '۱۲۳٫۴۵', 'expected' => '۱۲۳٫۴۵'],
            ['input' => '1234٫56', 'expected' => '۱٬۲۳۴٫۵۶'],
            ['input' => '1234567٫89', 'expected' => '۱٬۲۳۴٬۵۶۷٫۸۹'],
            ['input' => '۰٫۰', 'expected' => '۰٫۰'],
            ['input' => '-۰٫۰', 'expected' => '-۰٫۰'],
            ['input' => '0.0e0', 'expected' => '۰٫۰'],
            ['input' => '۰٫۰e0', 'expected' => '۰٫۰'],
        ];

        foreach ($farsiTestCases as $index => $case) {
            // It's good practice to ensure input strings with non-ASCII characters are correctly handled in test messages
            $inputForMessage = is_string($case['input']) ? $case['input'] : (string)$case['input'];
            $this->assertSame($case['expected'], $formatter->toPlainString($case['input']), "Farsi test case #{$index} Input: {$inputForMessage}");
        }
    }
}
