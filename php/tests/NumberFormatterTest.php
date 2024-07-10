<?php

use PHPUnit\Framework\TestCase;
use NumberFormatter\NumberFormatter; // Import the class with the namespace
require_once '../reduce-precision/src/NumberFormatter.php'; // Adjust the path if necessary

class NumberFormatterTest extends TestCase
{
    public function testDefaultFormat()
    {
        $formatter = new NumberFormatter();
        $this->assertEquals('123', $formatter->toString('123'));
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
        $this->assertEquals('1.233', $formatter->toString('1.23e3'));
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
}

