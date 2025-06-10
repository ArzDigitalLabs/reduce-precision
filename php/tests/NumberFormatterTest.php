<?php

use PHPUnit\Framework\TestCase;
use NumberFormatter\NumberFormatter; // Import the class with the namespace
require_once __DIR__ . '/../src/NumberFormatter.php'; // Corrected path

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
        // Corrected expectation: 1.23e3 is 1230. With 2 decimal places from '1.23' and thousand separator for 'en'
        $this->assertEquals('1,230.00', $formatter->toString('1.23e3'));
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
        // Updated expectation: with p=4, d=2, f=2 for <0.01 range, 0.0001 should be 0.0001
        $this->assertEquals('0.0001', $formatter->toString('0.0001'));
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

    public function testLowPrecisionFixes()
    {
        // English Locale (en)
        $formatter = new NumberFormatter(['precision' => 'low', 'language' => 'en']);
        $this->assertEquals('0.001', $formatter->toString(0.001));
        $this->assertEquals('0.0001', $formatter->toString(0.0001));
        $this->assertEquals('0.0000', $formatter->toString(0.00001));
        $this->assertEquals('0.005', $formatter->toString(0.005));
        $this->assertEquals('0.0099', $formatter->toString(0.0099));
        $this->assertEquals('0.00', $formatter->toString(0));

        $this->assertEquals('0.01', $formatter->toString(0.01));
        $this->assertEquals('0.04', $formatter->toString(0.04));
        $this->assertEquals('0.1', $formatter->toString(0.05));
        $this->assertEquals('0.1', $formatter->toString(0.09));

        $this->assertEquals('0.1', $formatter->toString(0.1));
        $this->assertEquals('0.12', $formatter->toString(0.12));
        $this->assertEquals('0.12', $formatter->toString(0.123));
        $this->assertEquals('0.99', $formatter->toString(0.99));
        $this->assertEquals('1.00', $formatter->toString(0.999));

        // Persian Locale (fa)
        $formatterFa = new NumberFormatter(['precision' => 'low', 'language' => 'fa']);
        $this->assertEquals('۰٬۰۰۱', $formatterFa->toString(0.001));
        $this->assertEquals('۰٬۰۰۰۱', $formatterFa->toString(0.0001));
        $this->assertEquals('۰٬۰۰۰۰', $formatterFa->toString(0.00001));
        $this->assertEquals('۰٬۰۰', $formatterFa->toString(0));

        $this->assertEquals('۰٬۰۱', $formatterFa->toString(0.01));
        $this->assertEquals('۰٬۱', $formatterFa->toString(0.05));
    }

    public function testIncrementalInputScenarios()
    {
        // Very Small Decimal Number (High Precision)
        $formatter = new NumberFormatter(['precision' => 'high', 'language' => 'en']);
        $this->assertEquals('0', $formatter->toString('0'));
        $this->assertEquals('0.', $formatter->toString('0.'));
        $this->assertEquals('0.0', $formatter->toString('0.0'));
        $this->assertEquals('0.00000003', $formatter->toString('0.00000003'));
        $this->assertEquals('0.000000030', $formatter->toString('0.000000030'));
        $this->assertEquals('0.00000003021', $formatter->toString('0.00000003021'));

        // E-commerce Price (USD Template)
        $usdFormatter = new NumberFormatter(['language' => 'en', 'template' => 'usd', 'precision' => 'high']);
        $this->assertEquals('$1', $usdFormatter->toString('1'));
        $this->assertEquals('$19', $usdFormatter->toString('19'));
        $this->assertEquals('$19.', $usdFormatter->toString('19.'));
        $this->assertEquals('$19.9', $usdFormatter->toString('19.9'));
        $this->assertEquals('$19.99', $usdFormatter->toString('19.99'));

        // Percentage Value (Percent Template)
        $percentFormatter = new NumberFormatter(['language' => 'en', 'template' => 'percent', 'precision' => 'low']);
        $this->assertEquals('0.00%', $percentFormatter->toString(0));
        $this->assertEquals('0.00%', $percentFormatter->toString('0'));
        $this->assertEquals('0.00%', $percentFormatter->toString('0.'));
        $this->assertEquals('0.2%', $percentFormatter->toString('0.2'));
        $this->assertEquals('0.25%', $percentFormatter->toString('0.25'));
        $this->assertEquals('0.26%', $percentFormatter->toString('0.257'));

        // Banking Amount (High Precision)
        $highPrecisionFormatter = new NumberFormatter(['language' => 'en', 'precision' => 'high']);
        $this->assertEquals('5', $highPrecisionFormatter->toString('5'));
        $this->assertEquals('50,000', $highPrecisionFormatter->toString('50000'));
        $this->assertEquals('50,000.', $highPrecisionFormatter->toString('50000.'));
        $this->assertEquals('50,000.5', $highPrecisionFormatter->toString('50000.5'));
        $this->assertEquals('50,000.50', $highPrecisionFormatter->toString('50000.50'));

        // Thousand Separator Test (High Precision)
        // Re-use $formatter from "Very Small Decimal" or create new
        $formatter = new NumberFormatter(['language' => 'en', 'precision' => 'high']);
        $this->assertEquals('1', $formatter->toString('1'));
        $this->assertEquals('1,000', $formatter->toString('1000'));
        $this->assertEquals('10,000', $formatter->toString('10000'));
        $this->assertEquals('100,002', $formatter->toString('100002'));
        $this->assertEquals('1,000,023', $formatter->toString('1,000,023'));
        $this->assertEquals('1,000,023.', $formatter->toString('1,000,023.'));
        $this->assertEquals('1,000,023.4', $formatter->toString('1,000,023.4'));
        $this->assertEquals('1,000,023.45', $formatter->toString('1,000,023.45'));

        // Edge Case: Inputting Just a Decimal Separator
        $formatter = new NumberFormatter(['precision' => 'high', 'language' => 'en']);
        $this->assertEquals('0.', $formatter->toString('.'));
        $this->assertEquals('-0.', $formatter->toString('-.'));

        // Persian Locale Incremental Input
        $faFormatter = new NumberFormatter(['language' => 'fa', 'precision' => 'high']);
        $this->assertEquals('۱', $faFormatter->toString('1'));
        $this->assertEquals('۱٬۲۳۴', $faFormatter->toString('1234'));
        $this->assertEquals('۱٬۲۳۴٫', $faFormatter->toString('1234.'));
        $this->assertEquals('۱٬۲۳۴٫۵', $faFormatter->toString('1234.5'));
        $this->assertEquals('۱٬۲۳۴٫۵۶', $faFormatter->toString('1234.56'));
        $this->assertEquals('۰٫', $faFormatter->toString('0.'));
        $this->assertEquals('۰٫۵', $faFormatter->toString('.5'));

        $faPercentFormatter = new NumberFormatter(['language' => 'fa', 'template' => 'percent', 'precision' => 'low']);
        $this->assertEquals('۰٫۰۰٪', $faPercentFormatter->toString('0'));
        $this->assertEquals('۰٫۰۰٪', $faPercentFormatter->toString('0.'));
        $this->assertEquals('۰٫۲٪', $faPercentFormatter->toString('0.2'));
        $this->assertEquals('۰٫۲۵٪', $faPercentFormatter->toString('0.25'));
    }
}
