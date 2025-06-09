import NumberFormatter from '../../src/format'; // Path from ts/test/format/ to ts/src/format/index.ts

describe('NumberFormatter Low Precision Fix', () => {
  // Test cases for English locale
  describe('English Locale (en)', () => {
    const formatter = new NumberFormatter({ precision: 'low', language: 'en' });

    it('should correctly format very small numbers (0 <= number < 0.01) after fix', () => {
      // This range now uses: p=2, d=2, r=true, f=2 (d was 0)
      expect(formatter.toString(0.001)).toBe('0.001');
      expect(formatter.toString(0.0001)).toBe('0.0001');
      expect(formatter.toString(0.00001)).toBe('0.0000');
      expect(formatter.toString(0.005)).toBe('0.005');
      expect(formatter.toString(0.0099)).toBe('0.0099');
    });

    it('should format zero correctly with fixed decimal places for (0 <= number < 0.01) range', () => {
      // With f=2 for this range, 0 should be "0.00"
      expect(formatter.toString(0)).toBe('0.00');
    });

    it('should correctly format numbers where 0.01 <= number < 0.1 (existing behavior)', () => {
      // This range uses: p=2, d=1, r=true. (f is not set, so 0)
      expect(formatter.toString(0.01)).toBe('0.01');
      expect(formatter.toString(0.04)).toBe('0.04');
      expect(formatter.toString(0.05)).toBe('0.1');
      expect(formatter.toString(0.09)).toBe('0.1');
    });

    it('should correctly format numbers where 0.1 <= number < 1 (existing behavior)', () => {
      // This range uses: p=2, d=2, r=true. (f is not set, so 0)
      expect(formatter.toString(0.1)).toBe('0.1'); // Not "0.10" as f=0
      expect(formatter.toString(0.12)).toBe('0.12');
      expect(formatter.toString(0.123)).toBe('0.12');
      expect(formatter.toString(0.99)).toBe('0.99');
      expect(formatter.toString(0.999)).toBe('1.00');
    });
  });

  // Test cases for Persian locale
  describe('Persian Locale (fa)', () => {
    const formatter = new NumberFormatter({ precision: 'low', language: 'fa' });

    it('should correctly format very small numbers (0 <= number < 0.01) after fix', () => {
      expect(formatter.toString(0.001)).toBe('۰٬۰۰۱');
      expect(formatter.toString(0.0001)).toBe('۰٬۰۰۰۱');
      expect(formatter.toString(0.00001)).toBe('۰٬۰۰۰۰');
    });

    it('should format zero correctly with fixed decimal places in fa for (0 <= number < 0.01) range', () => {
      expect(formatter.toString(0)).toBe('۰٬۰۰');
    });

    it('should correctly format numbers where 0.01 <= number < 0.1 in fa', () => {
      expect(formatter.toString(0.01)).toBe('۰٬۰۱'); // English "0.0"
      expect(formatter.toString(0.05)).toBe('۰٬۱'); // English "0.1"
    });
  });
});

describe('Incremental Input Scenarios', () => {
  describe('Very Small Decimal Number (High Precision)', () => {
    const formatter = new NumberFormatter({ precision: 'high', language: 'en' });
    it('should correctly format incremental input for very small decimals', () => {
      expect(formatter.toString('0')).toBe('0');
      expect(formatter.toString('0.')).toBe('0.');
      expect(formatter.toString('0.0')).toBe('0.0');
      expect(formatter.toString('0.00000003')).toBe('0.00000003');
      expect(formatter.toString('0.000000030')).toBe('0.000000030');
      expect(formatter.toString('0.00000003021')).toBe('0.00000003021');
    });
  });

  describe('E-commerce Price (USD Template)', () => {
    const usdFormatter = new NumberFormatter({ language: 'en', template: 'usd', precision: 'high' }); // Assuming high precision for price input
    it('should correctly format incremental input for USD prices', () => {
      expect(usdFormatter.toString('1')).toBe('$1');
      expect(usdFormatter.toString('19')).toBe('$19');
      expect(usdFormatter.toString('19.')).toBe('$19.');
      expect(usdFormatter.toString('19.9')).toBe('$19.9');
      expect(usdFormatter.toString('19.99')).toBe('$19.99');
    });
  });

  describe('Percentage Value (Percent Template)', () => {
    // Note: The original issue implies specific behavior for percent,
    // where "0" or "0." might auto-format to "0.00%".
    // This depends on how fixedDecimalZeros interacts with the new logic for this template.
    const percentFormatter = new NumberFormatter({ language: 'en', template: 'percent', precision: 'low' }); // Typically percent uses 'low'

    it('should format initial percentage inputs as per typical percent template behavior', () => {
      // Precision 'low' for template 'percent' has f=2 for numbers < 10 (e.g. 0-0.01 range has f=2)
      // If originalInput is "0" (number) or "0" (string without decimal), fixedDecimalZeros applies.
      expect(percentFormatter.toString(0)).toBe('0.00%');
      expect(percentFormatter.toString('0')).toBe('0.00%');

      // If originalInput is "0.", the new logic should preserve the decimal.
      // However, the percent template might have specific post-processing or fixedDecimalZeros
      // that still result in "0.00%". The issue description's "0." => "0.00%" implies this.
      // Based on the implemented changes, "0." would be "0.%" if not for fixedDecimalZeros.
      // Let's test the expectation from the issue.
      // The 'low' precision for 'percent' in the range 0 to 0.01 has f=2.
      // The code: `if (fixedDecimalZeros > 0 && fractionalPartStr.length === 0)` will make it "0.00"
      // Then "%" is added.
      expect(percentFormatter.toString('0.')).toBe('0.00%');
    });

    it('should correctly format incremental percentage inputs', () => {
      // For "0.2", fractionalPart is "2". fixedDecimalZeros might not apply or might be overridden.
      // The issue states "0.2" => "0.2%".
      // With precision 'low', 0.1 to 1 range has p=2, d=2, r=true, f=0.
      // So, "0.2" should be "0.2%".
      expect(percentFormatter.toString('0.2')).toBe('0.2%');
      expect(percentFormatter.toString('0.25')).toBe('0.25%');
      // What about "0.257"? Low precision for 0.1-1 is (p=2, d=2, r=true) -> "0.26%"
      expect(percentFormatter.toString('0.257')).toBe('0.26%');
    });
  });

  describe('Banking Amount (High Precision)', () => {
    const highPrecisionFormatter = new NumberFormatter({ language: 'en', precision: 'high' });
    it('should correctly format incremental input for banking amounts with thousand separators', () => {
      expect(highPrecisionFormatter.toString('5')).toBe('5');
      expect(highPrecisionFormatter.toString('50000')).toBe('50,000');
      expect(highPrecisionFormatter.toString('50000.')).toBe('50,000.');
      expect(highPrecisionFormatter.toString('50000.5')).toBe('50,000.5'); // Not "50,001"
      expect(highPrecisionFormatter.toString('50000.50')).toBe('50,000.50');
    });
  });

  describe('Thousand Separator Test (High Precision)', () => {
    const highPrecisionFormatter = new NumberFormatter({ language: 'en', precision: 'high' });
    it('should correctly apply thousand separators during incremental input', () => {
      expect(highPrecisionFormatter.toString('1')).toBe('1');
      expect(highPrecisionFormatter.toString('10')).toBe('10');
      expect(highPrecisionFormatter.toString('100')).toBe('100');
      expect(highPrecisionFormatter.toString('1000')).toBe('1,000');
      expect(highPrecisionFormatter.toString('10000')).toBe('10,000');
      expect(highPrecisionFormatter.toString('100002')).toBe('100,002');
      expect(highPrecisionFormatter.toString('1000023')).toBe('1,000,023');
      expect(highPrecisionFormatter.toString('1000023.')).toBe('1,000,023.');
      expect(highPrecisionFormatter.toString('1000023.4')).toBe('1,000,023.4');
      expect(highPrecisionFormatter.toString('1000023.45')).toBe('1,000,023.45');
    });
  });

  describe('Edge Case: Inputting Just a Decimal Separator', () => {
    const formatter = new NumberFormatter({ precision: 'high', language: 'en' });
    it('should handle input of just "."', () => {
      // Current logic might make this "0." if nonFractionalStr is empty and becomes "0"
      // The originalInput.includes('.') will be true. originalDecimalPart will be empty.
      // wholeNumberStr = `0${decimalSeparator}${''}` which is "0."
      expect(formatter.toString('.')).toBe('0.');
    });
    it('should handle input of just "-."', () => {
      // Similar to above, but with a sign
      expect(formatter.toString('-.')).toBe('-0.');
    });
  });

  describe('Persian Locale Incremental Input', () => {
    const faFormatter = new NumberFormatter({ language: 'fa', precision: 'high' });
    it('should correctly format incremental Persian numbers with correct separators', () => {
      expect(faFormatter.toString('1')).toBe('۱');
      expect(faFormatter.toString('1234')).toBe('۱٬۲۳۴');
      expect(faFormatter.toString('1234.')).toBe('۱٬۲۳۴٫');
      expect(faFormatter.toString('1234.5')).toBe('۱٬۲۳۴٫۵');
      expect(faFormatter.toString('1234.56')).toBe('۱٬۲۳۴٫۵۶');
      expect(faFormatter.toString('0.')).toBe('۰٫');
      expect(faFormatter.toString('.5')).toBe('۰٫۵');
    });

    const faPercentFormatter = new NumberFormatter({ language: 'fa', template: 'percent', precision: 'low' });
    it('should correctly format incremental Persian percentages', () => {
      expect(faPercentFormatter.toString('0')).toBe('۰٫۰۰٪'); // From f=2 for this range in low precision
      expect(faPercentFormatter.toString('0.')).toBe('۰٫۰۰٪'); // Similar, f=2 applies
      expect(faPercentFormatter.toString('0.2')).toBe('۰٫۲٪');
      expect(faPercentFormatter.toString('0.25')).toBe('۰٫۲۵٪');
    });
  });
});
